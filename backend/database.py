from __future__ import annotations

import os
import random
import sqlite3
from datetime import date, timedelta

# ── Detecção de banco ──────────────────────────────────────────────────────
# Render/Supabase entregam postgres:// — psycopg2 precisa de postgresql://
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

def get_connection():
    if USE_POSTGRES:
        url = DATABASE_URL
        if 'sslmode' not in url:
            sep = '&' if '?' in url else '?'
            url = url + sep + 'sslmode=require'
        conn = psycopg2.connect(url)
        return conn
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


# ── Helpers de query (SQLite ↔ PostgreSQL) ────────────────────────────────

def db_exec(conn, sql: str, params=None):
    """Executa SQL e retorna cursor com linhas dict-like em ambos os bancos."""
    params = params or []
    if USE_POSTGRES:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql.replace('?', '%s'), params)
        return cur
    return conn.execute(sql, params)


def db_exec_many(conn, sql: str, params_list):
    """Executa batch INSERT."""
    if USE_POSTGRES:
        cur = conn.cursor()
        cur.executemany(sql.replace('?', '%s'), params_list)
        return cur
    return conn.executemany(sql, params_list)


def db_scalar(row, key: str):
    """Lê um valor escalar de uma linha de forma agnóstica ao banco."""
    if row is None:
        return None
    if USE_POSTGRES:
        return row.get(key)           # RealDictRow é um dict
    try:
        return row[key]               # sqlite3.Row suporta acesso por nome
    except IndexError:
        return None


def insert_returning_id(conn, sql: str, params) -> int:
    """INSERT e retorna o id gerado (RETURNING para PG, lastrowid para SQLite)."""
    if USE_POSTGRES:
        cur = conn.cursor()
        cur.execute(sql.replace('?', '%s') + ' RETURNING id', params)
        return cur.fetchone()[0]
    cur = conn.execute(sql, params)
    return cur.lastrowid


def month_expr(col: str) -> str:
    """Expressão SQL para agrupar por YYYY-MM."""
    if USE_POSTGRES:
        return f"TO_CHAR({col}, 'YYYY-MM')"
    return f"strftime('%Y-%m', {col})"


# ── Inicialização do schema ────────────────────────────────────────────────

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
        cur.execute("""
            CREATE TABLE IF NOT EXISTS producao_rebanho (
                id                   BIGSERIAL PRIMARY KEY,
                upload_id            BIGINT REFERENCES uploads(id),
                fazenda              TEXT NOT NULL DEFAULT '',
                data_registro        DATE NOT NULL,
                lote                 TEXT NOT NULL,
                num_vacas            INTEGER NOT NULL,
                producao_leite_total REAL NOT NULL,
                leite_por_vaca       REAL NOT NULL,
                consumo_ms_total     REAL NOT NULL,
                consumo_ms_vaca      REAL NOT NULL,
                percentual_forragem  REAL NOT NULL,
                eficiencia_alimentar REAL NOT NULL,
                pct_ms_forragem      REAL,
                pct_ms_dieta         REAL,
                created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_data_lote ON producao_rebanho(data_registro, lote)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_fazenda   ON producao_rebanho(fazenda)")
        # Migrations (ADD COLUMN IF NOT EXISTS — PostgreSQL 9.6+)
        for col, defn in [
            ("fazenda",         "TEXT NOT NULL DEFAULT ''"),
            ("pct_ms_forragem", "REAL"),
            ("pct_ms_dieta",    "REAL"),
        ]:
            cur.execute(f"ALTER TABLE producao_rebanho ADD COLUMN IF NOT EXISTS {col} {defn}")
        conn.commit()

    else:  # SQLite
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS uploads (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                filename     TEXT NOT NULL,
                uploaded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                num_records  INTEGER DEFAULT 0,
                notes        TEXT
            );
            CREATE TABLE IF NOT EXISTS producao_rebanho (
                id                   INTEGER PRIMARY KEY AUTOINCREMENT,
                upload_id            INTEGER REFERENCES uploads(id),
                fazenda              TEXT NOT NULL DEFAULT '',
                data_registro        DATE NOT NULL,
                lote                 TEXT NOT NULL,
                num_vacas            INTEGER NOT NULL,
                producao_leite_total REAL NOT NULL,
                leite_por_vaca       REAL NOT NULL,
                consumo_ms_total     REAL NOT NULL,
                consumo_ms_vaca      REAL NOT NULL,
                percentual_forragem  REAL NOT NULL,
                eficiencia_alimentar REAL NOT NULL,
                pct_ms_forragem      REAL,
                pct_ms_dieta         REAL,
                created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_data_lote ON producao_rebanho(data_registro, lote);
            CREATE INDEX IF NOT EXISTS idx_fazenda   ON producao_rebanho(fazenda);
        """)
        cur = conn.cursor()
        existing = {row[1] for row in cur.execute("PRAGMA table_info(producao_rebanho)").fetchall()}
        for col, defn in [
            ("fazenda",         "TEXT NOT NULL DEFAULT ''"),
            ("pct_ms_forragem", "REAL"),
            ("pct_ms_dieta",    "REAL"),
        ]:
            if col not in existing:
                cur.execute(f"ALTER TABLE producao_rebanho ADD COLUMN {col} {defn}")
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
            records.append((
                upload_id, "Fazenda Teste", d.isoformat(), lote,
                nv, round(lv * nv, 1), lv, round(mv * nv, 1), mv,
                forr, round(lv / mv, 4), pmf, pmd,
            ))
        d += timedelta(weeks=1)

    db_exec_many(
        conn,
        """INSERT INTO producao_rebanho
           (upload_id, fazenda, data_registro, lote, num_vacas,
            producao_leite_total, leite_por_vaca,
            consumo_ms_total, consumo_ms_vaca,
            percentual_forragem, eficiencia_alimentar,
            pct_ms_forragem, pct_ms_dieta)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        records,
    )
    db_exec(conn, "UPDATE uploads SET num_records=? WHERE id=?", [len(records), upload_id])
    conn.commit()
    conn.close()
