from __future__ import annotations

import os
import random
import sqlite3
from datetime import date, timedelta

# ── Detecção de banco ──────────────────────────────────────────────────────
_raw_url = os.environ.get('DATABASE_URL', '')
DATABASE_URL = _raw_url.replace('postgres://', 'postgresql://', 1) if _raw_url.startswith('postgres://') else _raw_url
USE_POSTGRES = DATABASE_URL.startswith('postgresql://')

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras

DB_PATH = os.path.join(os.path.dirname(__file__), 'fazenda.db')

# ── Parâmetros do seed (Fazenda Teste) ────────────────────────────────────
LOTE_PARAMS: dict[str, dict] = {
    "TOP VACA":  {"vacas": (45, 52), "leite": (38.0, 43.0), "ms": (24.5, 27.0), "forr": (44, 54), "pct_ms_forr": (28.0, 33.0), "pct_ms_dieta": (42.0, 48.0)},
    "TOP NOV":   {"vacas": (28, 36), "leite": (28.0, 34.0), "ms": (20.0, 23.5), "forr": (47, 56), "pct_ms_forr": (27.0, 32.0), "pct_ms_dieta": (40.0, 46.0)},
    "CB1":       {"vacas": (55, 65), "leite": (32.0, 38.0), "ms": (22.0, 25.5), "forr": (50, 59), "pct_ms_forr": (29.0, 34.0), "pct_ms_dieta": (43.0, 49.0)},
    "CB2":       {"vacas": (58, 70), "leite": (26.0, 31.0), "ms": (19.5, 22.5), "forr": (52, 61), "pct_ms_forr": (30.0, 35.0), "pct_ms_dieta": (44.0, 50.0)},
    "CB4":       {"vacas": (40, 50), "leite": (20.0, 26.0), "ms": (16.5, 20.0), "forr": (56, 65), "pct_ms_forr": (31.0, 36.0), "pct_ms_dieta": (45.0, 51.0)},
    "PÓS PARTO": {"vacas": (18, 28), "leite": (22.0, 30.0), "ms": (18.0, 22.0), "forr": (39, 50), "pct_ms_forr": (26.0, 31.0), "pct_ms_dieta": (38.0, 44.0)},
}
LOTES = list(LOTE_PARAMS.keys())


# ── Conexão ────────────────────────────────────────────────────────────────

def _parse_pg_url(url: str) -> dict:
    url = url.replace('postgres://', 'postgresql://', 1)
    rest = url[len('postgresql://'):]
    userinfo, hostinfo = rest.rsplit('@', 1)
    user, password = userinfo.split(':', 1)
    hostport, dbname = hostinfo.split('/', 1)
    dbname = dbname.split('?')[0]
    if ':' in hostport:
        host, port_str = hostport.rsplit(':', 1)
        port = int(port_str)
    else:
        host, port = hostport, 5432
    return {'user': user, 'password': password, 'host': host,
            'port': port, 'dbname': dbname, 'sslmode': 'require'}


def get_connection():
    if USE_POSTGRES:
        conn = psycopg2.connect(**_parse_pg_url(DATABASE_URL))
        return conn
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


# ── Helpers de query (SQLite ↔ PostgreSQL) ────────────────────────────────

def db_exec(conn, sql: str, params=None):
    params = params or []
    if USE_POSTGRES:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql.replace('?', '%s'), params)
        return cur
    return conn.execute(sql, params)


def db_exec_many(conn, sql: str, params_list):
    if USE_POSTGRES:
        cur = conn.cursor()
        cur.executemany(sql.replace('?', '%s'), params_list)
        return cur
    return conn.executemany(sql, params_list)


def db_scalar(row, key: str):
    if row is None:
        return None
    if USE_POSTGRES:
        return row.get(key)
    try:
        return row[key]
    except IndexError:
        return None


def insert_returning_id(conn, sql: str, params) -> int:
    if USE_POSTGRES:
        cur = conn.cursor()
        cur.execute(sql.replace('?', '%s') + ' RETURNING id', params)
        return cur.fetchone()[0]
    cur = conn.execute(sql, params)
    return cur.lastrowid


def month_expr(col: str) -> str:
    if USE_POSTGRES:
        return f"TO_CHAR({col}, 'YYYY-MM')"
    return f"strftime('%Y-%m', {col})"


# ── Inicialização do schema ────────────────────────────────────────────────

_PRODUCAO_COLS_NULLABLE = """
    id                   {pk},
    upload_id            {fk_uploads},
    fazenda              TEXT NOT NULL DEFAULT '',
    data_registro        DATE NOT NULL,
    lote                 TEXT NOT NULL,
    num_vacas            INTEGER NOT NULL,
    producao_leite_total REAL,
    leite_por_vaca       REAL,
    consumo_ms_total     REAL,
    consumo_ms_vaca      REAL,
    percentual_forragem  REAL,
    eficiencia_alimentar REAL,
    pct_ms_forragem      REAL,
    pct_ms_dieta         REAL,
    qtd_dieta_fornecida  REAL,
    qtd_sobra_dieta      REAL,
    pct_sobra            REAL,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
"""


def init_db() -> None:
    conn = get_connection()

    if USE_POSTGRES:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS uploads (
                id           BIGSERIAL PRIMARY KEY,
                filename     TEXT NOT NULL,
                uploaded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                num_records  INTEGER DEFAULT 0,
                notes        TEXT
            )
        """)
        pk  = "BIGSERIAL PRIMARY KEY"
        fk  = "BIGINT REFERENCES uploads(id)"
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS producao_rebanho (
                {_PRODUCAO_COLS_NULLABLE.format(pk=pk, fk_uploads=fk)}
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_data_lote ON producao_rebanho(data_registro, lote)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_fazenda   ON producao_rebanho(fazenda)")
        # Idempotent column additions & NOT NULL drops
        for col, defn in [
            ("fazenda",              "TEXT NOT NULL DEFAULT ''"),
            ("pct_ms_forragem",      "REAL"),
            ("pct_ms_dieta",         "REAL"),
            ("qtd_dieta_fornecida",  "REAL"),
            ("qtd_sobra_dieta",      "REAL"),
            ("pct_sobra",            "REAL"),
        ]:
            cur.execute(f"ALTER TABLE producao_rebanho ADD COLUMN IF NOT EXISTS {col} {defn}")
        # Drop NOT NULL on formerly-required calculated columns
        for col in ("producao_leite_total", "leite_por_vaca", "consumo_ms_total",
                    "consumo_ms_vaca", "percentual_forragem", "eficiencia_alimentar"):
            cur.execute(f"ALTER TABLE producao_rebanho ALTER COLUMN {col} DROP NOT NULL")
        # meta_sobra table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS meta_sobra (
                id        BIGSERIAL PRIMARY KEY,
                fazenda   TEXT NOT NULL,
                lote      TEXT NOT NULL,
                meta_pct  REAL NOT NULL,
                UNIQUE(fazenda, lote)
            )
        """)
        conn.commit()

    else:  # SQLite
        cur = conn.cursor()
        # Check if migration to nullable/new-columns schema is needed
        existing_info = cur.execute("PRAGMA table_info(producao_rebanho)").fetchall()
        existing_cols = {row[1] for row in existing_info}

        if not existing_cols:
            # Fresh install
            conn.executescript(f"""
                CREATE TABLE IF NOT EXISTS uploads (
                    id           INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename     TEXT NOT NULL,
                    uploaded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    num_records  INTEGER DEFAULT 0,
                    notes        TEXT
                );
                CREATE TABLE IF NOT EXISTS producao_rebanho (
                    {_PRODUCAO_COLS_NULLABLE.format(
                        pk='INTEGER PRIMARY KEY AUTOINCREMENT',
                        fk_uploads='INTEGER REFERENCES uploads(id)'
                    )}
                );
                CREATE INDEX IF NOT EXISTS idx_data_lote ON producao_rebanho(data_registro, lote);
                CREATE INDEX IF NOT EXISTS idx_fazenda   ON producao_rebanho(fazenda);
            """)
        elif 'qtd_dieta_fornecida' not in existing_cols:
            # Migrate: rebuild table to make cols nullable and add new columns
            conn.executescript(f"""
                BEGIN;
                CREATE TABLE producao_rebanho_v2 (
                    {_PRODUCAO_COLS_NULLABLE.format(
                        pk='INTEGER PRIMARY KEY AUTOINCREMENT',
                        fk_uploads='INTEGER REFERENCES uploads(id)'
                    )}
                );
                INSERT INTO producao_rebanho_v2
                    (id, upload_id, fazenda, data_registro, lote, num_vacas,
                     producao_leite_total, leite_por_vaca,
                     consumo_ms_total, consumo_ms_vaca,
                     percentual_forragem, eficiencia_alimentar,
                     pct_ms_forragem, pct_ms_dieta,
                     qtd_dieta_fornecida, qtd_sobra_dieta, pct_sobra,
                     created_at)
                SELECT id, upload_id, fazenda, data_registro, lote, num_vacas,
                       producao_leite_total, leite_por_vaca,
                       consumo_ms_total, consumo_ms_vaca,
                       percentual_forragem, eficiencia_alimentar,
                       pct_ms_forragem, pct_ms_dieta,
                       NULL, NULL, NULL,
                       created_at
                FROM producao_rebanho;
                DROP TABLE producao_rebanho;
                ALTER TABLE producao_rebanho_v2 RENAME TO producao_rebanho;
                CREATE INDEX IF NOT EXISTS idx_data_lote ON producao_rebanho(data_registro, lote);
                CREATE INDEX IF NOT EXISTS idx_fazenda   ON producao_rebanho(fazenda);
                COMMIT;
            """)

        # meta_sobra (idempotent)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS meta_sobra (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                fazenda   TEXT NOT NULL,
                lote      TEXT NOT NULL,
                meta_pct  REAL NOT NULL,
                UNIQUE(fazenda, lote)
            )
        """)
        conn.commit()

    conn.close()


# ── Seed (dados demo) ──────────────────────────────────────────────────────

def seed_data() -> None:
    conn = get_connection()

    row = db_exec(conn, "SELECT COUNT(*) AS cnt FROM producao_rebanho").fetchone()
    if db_scalar(row, 'cnt') > 0:
        conn.close()
        return

    upload_id = insert_returning_id(
        conn,
        "INSERT INTO uploads (filename, notes) VALUES (?, ?)",
        ("seed_jan_abr_2026.xlsx", "Dados fictícios de demonstração Jan–Abr 2026 — Fazenda Teste"),
    )

    random.seed(42)
    start, end = date(2026, 1, 1), date(2026, 4, 30)
    records: list = []

    d = start
    while d <= end:
        weeks        = (d - start).days / 7.0
        month_factor = {2: 0.97, 3: 1.02, 4: 1.02}.get(d.month, 1.0)
        for lote, p in LOTE_PARAMS.items():
            nv   = random.randint(*p["vacas"])
            lv   = round(random.uniform(*p["leite"]) * month_factor * (1 + weeks * 0.002), 2)
            mv   = round(random.uniform(*p["ms"]), 2)
            forr = round(random.uniform(*p["forr"]), 1)
            pmf  = round(random.uniform(*p["pct_ms_forr"]), 1)
            pmd  = round(random.uniform(*p["pct_ms_dieta"]), 1)

            cms_total = round(mv * nv, 1)
            ef        = round(lv / mv, 4)

            # Gerar inputs brutos (back-calculate de CMS)
            sobra_pct           = round(random.uniform(4.0, 9.0), 1)
            qtd_consumida_mn    = round(cms_total / (pmd / 100), 1)
            qtd_dieta_fornecida = round(qtd_consumida_mn / (1 - sobra_pct / 100), 1)
            qtd_sobra_dieta     = round(qtd_dieta_fornecida * sobra_pct / 100, 1)

            records.append((
                upload_id, "Fazenda Teste", d.isoformat(), lote,
                nv,
                round(lv * nv, 1), lv,
                cms_total, mv,
                forr, ef,
                pmf, pmd,
                qtd_dieta_fornecida, qtd_sobra_dieta, sobra_pct,
            ))
        d += timedelta(weeks=1)

    db_exec_many(
        conn,
        """INSERT INTO producao_rebanho
           (upload_id, fazenda, data_registro, lote, num_vacas,
            producao_leite_total, leite_por_vaca,
            consumo_ms_total, consumo_ms_vaca,
            percentual_forragem, eficiencia_alimentar,
            pct_ms_forragem, pct_ms_dieta,
            qtd_dieta_fornecida, qtd_sobra_dieta, pct_sobra)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        records,
    )
    db_exec(conn, "UPDATE uploads SET num_records=? WHERE id=?", [len(records), upload_id])
    conn.commit()
    conn.close()
