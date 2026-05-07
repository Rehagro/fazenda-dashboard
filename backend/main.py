from __future__ import annotations

import io
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from database import (
    get_connection, init_db, seed_data,
    db_exec, db_exec_many, db_scalar, insert_returning_id, month_expr,
    USE_POSTGRES,
)

app = FastAPI(title="Fazenda Nutrition Dashboard API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


_db_ready = False


@app.on_event("startup")
async def on_startup():
    global _db_ready
    try:
        init_db()
        seed_data()
        _db_ready = True
    except Exception as exc:
        logger.error("Falha ao inicializar o banco de dados: %s", exc)
        logger.error("Verifique a variável DATABASE_URL no painel do Render.")


# ──────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────

@app.get("/api/health")
def health():
    if not _db_ready:
        return {"status": "error", "db": "unavailable",
                "detail": "Banco não inicializado — verifique DATABASE_URL no Render"}
    try:
        conn = get_connection()
        db_exec(conn, "SELECT 1")
        conn.close()
        return {"status": "ok", "db": "postgresql" if USE_POSTGRES else "sqlite"}
    except Exception as exc:
        logger.error("Health check DB query failed: %s", exc)
        return {"status": "error", "db": "unavailable", "detail": str(exc)}


# ──────────────────────────────────────────────
# WHERE builder
# ──────────────────────────────────────────────

def _build_where(
    data_inicio: Optional[str],
    data_fim:    Optional[str],
    lotes_str:   Optional[str],
    fazenda:     Optional[str] = None,
) -> tuple[str, list]:
    clauses, params = [], []
    if fazenda:
        clauses.append("fazenda = ?")
        params.append(fazenda)
    if data_inicio:
        clauses.append("data_registro >= ?")
        params.append(data_inicio)
    if data_fim:
        clauses.append("data_registro <= ?")
        params.append(data_fim)
    if lotes_str:
        lote_list = [l.strip() for l in lotes_str.split(",") if l.strip()]
        if lote_list:
            ph = ",".join("?" * len(lote_list))
            clauses.append(f"lote IN ({ph})")
            params.extend(lote_list)
    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    return where, params


# ──────────────────────────────────────────────
# Meta endpoints
# ──────────────────────────────────────────────

@app.get("/api/fazendas")
def get_fazendas():
    conn = get_connection()
    rows = db_exec(conn,
        "SELECT DISTINCT fazenda FROM producao_rebanho WHERE fazenda != '' ORDER BY fazenda"
    ).fetchall()
    conn.close()
    return {"fazendas": [r["fazenda"] for r in rows]}


@app.get("/api/lotes")
def get_lotes(fazenda: Optional[str] = Query(None)):
    conn = get_connection()
    if fazenda:
        rows = db_exec(conn,
            "SELECT DISTINCT lote FROM producao_rebanho WHERE fazenda = ? ORDER BY lote",
            [fazenda],
        ).fetchall()
    else:
        rows = db_exec(conn,
            "SELECT DISTINCT lote FROM producao_rebanho ORDER BY lote"
        ).fetchall()
    conn.close()
    return {"lotes": [r["lote"] for r in rows]}


@app.get("/api/dates")
def get_dates(fazenda: Optional[str] = Query(None)):
    conn = get_connection()
    if fazenda:
        row = db_exec(conn,
            "SELECT MIN(data_registro) AS min_d, MAX(data_registro) AS max_d "
            "FROM producao_rebanho WHERE fazenda = ?",
            [fazenda],
        ).fetchone()
    else:
        row = db_exec(conn,
            "SELECT MIN(data_registro) AS min_d, MAX(data_registro) AS max_d "
            "FROM producao_rebanho"
        ).fetchone()
    conn.close()
    return {
        "min_date": str(row["min_d"]) if row["min_d"] else None,
        "max_date": str(row["max_d"]) if row["max_d"] else None,
    }


# ──────────────────────────────────────────────
# Dashboard data
# ──────────────────────────────────────────────

@app.get("/api/dashboard/data")
def dashboard_data(
    data_inicio: Optional[str] = Query(None),
    data_fim:    Optional[str] = Query(None),
    lotes:       Optional[str] = Query(None),
    fazenda:     Optional[str] = Query(None),
):
    where, params = _build_where(data_inicio, data_fim, lotes, fazenda)
    conn = get_connection()
    rows = db_exec(conn,
        f"""SELECT data_registro, fazenda, lote, num_vacas,
                   producao_leite_total, leite_por_vaca,
                   consumo_ms_total, consumo_ms_vaca,
                   percentual_forragem, eficiencia_alimentar,
                   pct_ms_forragem, pct_ms_dieta
            FROM producao_rebanho
            {where}
            ORDER BY data_registro, lote""",
        params,
    ).fetchall()
    conn.close()
    return {"data": [dict(r) for r in rows]}


@app.get("/api/dashboard/kpis")
def dashboard_kpis(
    data_inicio: Optional[str] = Query(None),
    data_fim:    Optional[str] = Query(None),
    lotes:       Optional[str] = Query(None),
    fazenda:     Optional[str] = Query(None),
):
    where, params = _build_where(data_inicio, data_fim, lotes, fazenda)
    conn = get_connection()

    last_row = db_exec(conn,
        f"SELECT MAX(data_registro) AS max_d FROM producao_rebanho {where}", params
    ).fetchone()
    last_date = db_scalar(last_row, 'max_d')
    if last_date:
        last_date = str(last_date)

    if not last_date:
        conn.close()
        return {
            "total_producao": 0, "total_vacas": 0,
            "eficiencia_ponderada": 0, "avg_forragem": 0,
            "leite_vaca_rebanho": 0, "ms_vaca_rebanho": 0,
            "avg_pct_ms_forragem": None, "avg_pct_ms_dieta": None,
        }

    where2, params2 = _build_where(last_date, last_date, lotes, fazenda)
    totals = db_exec(conn,
        f"""SELECT
               SUM(producao_leite_total)                                              AS total_prod,
               SUM(num_vacas)                                                         AS total_vacas,
               SUM(consumo_ms_total)                                                  AS total_ms,
               AVG(percentual_forragem)                                               AS avg_forr,
               SUM(pct_ms_forragem * num_vacas) /
                   NULLIF(SUM(CASE WHEN pct_ms_forragem IS NOT NULL THEN num_vacas ELSE 0 END), 0)
                                                                                      AS pct_ms_forr_pond,
               SUM(pct_ms_dieta * num_vacas) /
                   NULLIF(SUM(CASE WHEN pct_ms_dieta IS NOT NULL THEN num_vacas ELSE 0 END), 0)
                                                                                      AS pct_ms_dieta_pond
            FROM producao_rebanho {where2}""",
        params2,
    ).fetchone()
    conn.close()

    total_prod  = totals["total_prod"]  or 0
    total_ms    = totals["total_ms"]    or 1
    total_vacas = totals["total_vacas"] or 0
    avg_forr    = totals["avg_forr"]    or 0
    pf          = totals["pct_ms_forr_pond"]
    pd_         = totals["pct_ms_dieta_pond"]

    return {
        "total_producao":       round(float(total_prod), 1),
        "total_vacas":          int(total_vacas),
        "eficiencia_ponderada": round(float(total_prod) / float(total_ms), 4) if total_ms else 0,
        "avg_forragem":         round(float(avg_forr), 1),
        "leite_vaca_rebanho":   round(float(total_prod) / float(total_vacas), 2) if total_vacas else 0,
        "ms_vaca_rebanho":      round(float(total_ms) / float(total_vacas), 2)   if total_vacas else 0,
        "avg_pct_ms_forragem":  round(float(pf), 1)  if pf  is not None else None,
        "avg_pct_ms_dieta":     round(float(pd_), 1) if pd_ is not None else None,
        "ultima_data":          last_date,
    }


@app.get("/api/dashboard/batch-summary")
def batch_summary(
    data_inicio: Optional[str] = Query(None),
    data_fim:    Optional[str] = Query(None),
    lotes:       Optional[str] = Query(None),
    fazenda:     Optional[str] = Query(None),
):
    where, params = _build_where(data_inicio, data_fim, lotes, fazenda)
    conn = get_connection()
    rows = db_exec(conn,
        f"""SELECT
               lote,
               ROUND(AVG(num_vacas)::numeric, 1)                                   AS avg_vacas,
               ROUND((SUM(producao_leite_total)/SUM(num_vacas))::numeric, 2)        AS leite_vaca_pond,
               ROUND((SUM(consumo_ms_total)/SUM(num_vacas))::numeric, 2)            AS ms_vaca_pond,
               ROUND((SUM(producao_leite_total)/SUM(consumo_ms_total))::numeric, 4) AS eficiencia_pond,
               ROUND(AVG(percentual_forragem)::numeric, 1)                          AS avg_forragem,
               ROUND(AVG(pct_ms_forragem)::numeric, 1)                              AS avg_pct_ms_forragem,
               ROUND(AVG(pct_ms_dieta)::numeric, 1)                                 AS avg_pct_ms_dieta,
               COUNT(*)                                                              AS num_registros
            FROM producao_rebanho
            {where}
            GROUP BY lote
            ORDER BY eficiencia_pond DESC""",
        params,
    ).fetchall() if USE_POSTGRES else db_exec(conn,
        f"""SELECT
               lote,
               ROUND(AVG(num_vacas), 1)                                             AS avg_vacas,
               ROUND(SUM(producao_leite_total)/SUM(num_vacas), 2)                   AS leite_vaca_pond,
               ROUND(SUM(consumo_ms_total)/SUM(num_vacas), 2)                       AS ms_vaca_pond,
               ROUND(SUM(producao_leite_total)/SUM(consumo_ms_total), 4)            AS eficiencia_pond,
               ROUND(AVG(percentual_forragem), 1)                                   AS avg_forragem,
               ROUND(AVG(pct_ms_forragem), 1)                                       AS avg_pct_ms_forragem,
               ROUND(AVG(pct_ms_dieta), 1)                                          AS avg_pct_ms_dieta,
               COUNT(*)                                                              AS num_registros
            FROM producao_rebanho
            {where}
            GROUP BY lote
            ORDER BY eficiencia_pond DESC""",
        params,
    ).fetchall()
    conn.close()
    return {"data": [dict(r) for r in rows]}


@app.get("/api/dashboard/monthly")
def dashboard_monthly(
    data_inicio: Optional[str] = Query(None),
    data_fim:    Optional[str] = Query(None),
    lotes:       Optional[str] = Query(None),
    fazenda:     Optional[str] = Query(None),
):
    where, params = _build_where(data_inicio, data_fim, lotes, fazenda)
    mes = month_expr("data_registro")
    conn = get_connection()
    sql = f"""SELECT
               {mes}                                                                  AS mes,
               lote,
               ROUND(AVG(num_vacas)::numeric, 1)                                     AS avg_vacas,
               ROUND((SUM(producao_leite_total)/SUM(num_vacas))::numeric, 2)          AS leite_vaca_pond,
               ROUND((SUM(consumo_ms_total)/SUM(num_vacas))::numeric, 2)              AS ms_vaca_pond,
               ROUND((SUM(producao_leite_total)/SUM(consumo_ms_total))::numeric, 4)   AS eficiencia_pond,
               ROUND(AVG(percentual_forragem)::numeric, 1)                            AS avg_forragem,
               ROUND(AVG(pct_ms_forragem)::numeric, 1)                                AS avg_pct_ms_forragem,
               ROUND(AVG(pct_ms_dieta)::numeric, 1)                                   AS avg_pct_ms_dieta,
               COUNT(*)                                                                AS num_registros
            FROM producao_rebanho
            {where}
            GROUP BY {mes}, lote
            ORDER BY {mes}, lote""" if USE_POSTGRES else \
        f"""SELECT
               {mes}                                                                  AS mes,
               lote,
               ROUND(AVG(num_vacas), 1)                                              AS avg_vacas,
               ROUND(SUM(producao_leite_total)/SUM(num_vacas), 2)                    AS leite_vaca_pond,
               ROUND(SUM(consumo_ms_total)/SUM(num_vacas), 2)                        AS ms_vaca_pond,
               ROUND(SUM(producao_leite_total)/SUM(consumo_ms_total), 4)             AS eficiencia_pond,
               ROUND(AVG(percentual_forragem), 1)                                    AS avg_forragem,
               ROUND(AVG(pct_ms_forragem), 1)                                        AS avg_pct_ms_forragem,
               ROUND(AVG(pct_ms_dieta), 1)                                           AS avg_pct_ms_dieta,
               COUNT(*)                                                               AS num_registros
            FROM producao_rebanho
            {where}
            GROUP BY {mes}, lote
            ORDER BY {mes}, lote"""
    rows = db_exec(conn, sql, params).fetchall()
    conn.close()
    return {"data": [dict(r) for r in rows]}


@app.get("/api/dashboard/raw")
def dashboard_raw(
    data_inicio: Optional[str] = Query(None),
    data_fim:    Optional[str] = Query(None),
    lotes:       Optional[str] = Query(None),
    fazenda:     Optional[str] = Query(None),
):
    where, params = _build_where(data_inicio, data_fim, lotes, fazenda)
    conn = get_connection()
    rows = db_exec(conn,
        f"""SELECT
               pr.id, pr.fazenda, pr.data_registro, pr.lote, pr.num_vacas,
               pr.producao_leite_total, pr.leite_por_vaca,
               pr.consumo_ms_total, pr.consumo_ms_vaca,
               pr.percentual_forragem, pr.eficiencia_alimentar,
               pr.pct_ms_forragem, pr.pct_ms_dieta,
               pr.created_at,
               u.filename AS upload_filename
            FROM producao_rebanho pr
            LEFT JOIN uploads u ON pr.upload_id = u.id
            {where}
            ORDER BY pr.data_registro DESC, pr.lote""",
        params,
    ).fetchall()
    conn.close()
    return {"data": [dict(r) for r in rows]}


# ──────────────────────────────────────────────
# Upload
# ──────────────────────────────────────────────

REQUIRED_COLS = {
    "fazenda", "data", "lote", "num_vacas",
    "producao_leite_total", "leite_por_vaca",
    "consumo_ms_total", "consumo_ms_vaca",
    "percentual_forragem",
}
OPTIONAL_COLS = {"pct_ms_forragem", "pct_ms_dieta"}


@app.post("/api/upload")
async def upload_excel(file: UploadFile = File(...)):
    if not file.filename.endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(400, "Apenas .xlsx, .xls ou .csv são aceitos.")

    content = await file.read()
    try:
        if file.filename.endswith(".csv"):
            enc = "utf-8-sig"
            try:
                content.decode("utf-8-sig")
            except UnicodeDecodeError:
                enc = "latin-1"
            df = pd.read_csv(io.BytesIO(content), encoding=enc, sep=None, engine="python")
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Erro ao ler arquivo: {e}")

    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise HTTPException(400,
            f"Colunas obrigatórias ausentes: {', '.join(sorted(missing))}. "
            "Baixe o template para ver o formato correto.")

    # remove linhas de descrição do template (ex: "AAAA-MM-DD", "Nome da Fazenda")
    df = df[pd.to_datetime(df["data"], errors="coerce").notna()].copy()
    if df.empty:
        raise HTTPException(400, "Nenhuma linha com data válida encontrada. Verifique o formato da coluna 'data' (DD/MM/AAAA ou AAAA-MM-DD).")

    try:
        df["data"] = pd.to_datetime(df["data"], dayfirst=True).dt.date
        df["eficiencia_alimentar"] = (df["leite_por_vaca"] / df["consumo_ms_vaca"]).round(4)
    except Exception as e:
        raise HTTPException(400, f"Erro ao processar dados: {e}")
    for col in OPTIONAL_COLS:
        if col not in df.columns:
            df[col] = None

    conn = get_connection()

    upload_id = insert_returning_id(conn,
        "INSERT INTO uploads (filename, num_records) VALUES (?, ?)",
        (file.filename, len(df)),
    )

    records = [
        (
            upload_id,
            str(row["fazenda"]).strip(),
            row["data"].isoformat(),
            str(row["lote"]).strip(),
            int(row["num_vacas"]),
            float(row["producao_leite_total"]),
            float(row["leite_por_vaca"]),
            float(row["consumo_ms_total"]),
            float(row["consumo_ms_vaca"]),
            float(row["percentual_forragem"]),
            float(row["eficiencia_alimentar"]),
            float(row["pct_ms_forragem"]) if pd.notna(row.get("pct_ms_forragem")) else None,
            float(row["pct_ms_dieta"])    if pd.notna(row.get("pct_ms_dieta"))    else None,
        )
        for _, row in df.iterrows()
    ]

    db_exec_many(conn,
        """INSERT INTO producao_rebanho
           (upload_id, fazenda, data_registro, lote, num_vacas,
            producao_leite_total, leite_por_vaca,
            consumo_ms_total, consumo_ms_vaca,
            percentual_forragem, eficiencia_alimentar,
            pct_ms_forragem, pct_ms_dieta)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        records,
    )
    conn.commit()
    conn.close()

    return {
        "message": "Upload realizado com sucesso!",
        "records_inserted": len(records),
        "fazendas": sorted({r[1] for r in records}),
    }


@app.get("/api/uploads")
def list_uploads():
    conn = get_connection()
    rows = db_exec(conn,
        "SELECT id, filename, uploaded_at, num_records, notes FROM uploads ORDER BY uploaded_at DESC"
    ).fetchall()
    conn.close()
    return {"data": [dict(r) for r in rows]}


# ──────────────────────────────────────────────
# Template download
# ──────────────────────────────────────────────

@app.get("/api/template")
def download_template(fmt: str = Query("xlsx", pattern="^(xlsx|csv)$")):
    col_keys = [
        "fazenda", "data", "lote", "num_vacas",
        "producao_leite_total", "leite_por_vaca",
        "consumo_ms_total", "consumo_ms_vaca",
        "percentual_forragem", "pct_ms_forragem", "pct_ms_dieta",
    ]
    col_labels = [
        "Fazenda *", "Data *", "Lote *", "N Vacas *",
        "Prod. Leite kg *", "Leite/Vaca kg *",
        "CMS Total kg *", "CMS/Vaca kg *",
        "% Forragem *", "% MS Forragem", "% MS Dieta",
    ]
    col_hints = [
        "Nome da fazenda", "DD/MM/AAAA ou AAAA-MM-DD", "Ex: TOP VACA, CB1...",
        "Numero inteiro", "kg leite total do lote", "kg leite por vaca/dia",
        "kg MS total do lote", "kg MS por vaca/dia",
        "0 a 100 (ex: 52.5)", "Opcional (ex: 35.0)", "Opcional (ex: 47.0)",
    ]
    required = [True] * 9 + [False, False]

    examples = [
        ["Fazenda Sao Joao", "01/05/2026", "TOP VACA",  142, 5453, 38.4, 3522, 24.8, 52.1, 38.2, 49.6],
        ["Fazenda Sao Joao", "01/05/2026", "TOP NOV",    98, 3205, 32.7, 2166, 22.1, 54.8, 36.9, 47.8],
        ["Fazenda Sao Joao", "01/05/2026", "CB1",       165, 4653, 28.2, 3366, 20.4, 56.3, 35.4, 46.2],
        ["Fazenda Sao Joao", "01/05/2026", "CB2",       134, 3296, 24.6, 2653, 19.8, 58.9, 34.1, 44.7],
        ["Fazenda Sao Joao", "01/05/2026", "CB4",        89, 1762, 19.8, 1531, 17.2, 61.4, 32.8, 43.1],
        ["Fazenda Sao Joao", "01/05/2026", "POS PARTO",  42, 1474, 35.1,  991, 23.6, 50.8, 39.1, 50.4],
        ["Fazenda Sao Joao", "02/05/2026", "TOP VACA",  142, 5481, 38.6, 3536, 24.9, 52.0, 38.1, 49.5],
        ["Fazenda Sao Joao", "02/05/2026", "TOP NOV",    98, 3224, 32.9, 2156, 22.0, 54.7, 36.8, 47.7],
        ["Fazenda Sao Joao", "02/05/2026", "CB1",       165, 4686, 28.4, 3382, 20.5, 56.2, 35.3, 46.1],
        ["Fazenda Sao Joao", "02/05/2026", "CB2",       134, 3243, 24.2, 2640, 19.7, 59.0, 34.0, 44.6],
        ["Fazenda Sao Joao", "02/05/2026", "CB4",        89, 1744, 19.6, 1514, 17.0, 61.5, 32.7, 43.0],
        ["Fazenda Sao Joao", "02/05/2026", "POS PARTO",  42, 1450, 34.5,  978, 23.3, 51.0, 39.0, 50.2],
    ]

    if fmt == "csv":
        import csv
        from io import StringIO
        buf = StringIO()
        w = csv.writer(buf)
        w.writerow(col_keys)
        for ex in examples:
            w.writerow(ex)
        buf.seek(0)
        return StreamingResponse(
            iter([buf.getvalue().encode("utf-8-sig")]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=template_fazenda.csv"},
        )

    import openpyxl
    from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
    from openpyxl.utils import get_column_letter

    wb = openpyxl.Workbook()

    # ── Sheet 1: Dados ──────────────────────────────────────────────────────
    ws = wb.active
    ws.title = "Dados"
    n_cols = len(col_keys)
    last_col = get_column_letter(n_cols)

    def fill(hex_color):
        return PatternFill("solid", fgColor=hex_color)

    def border():
        t = Side(style="thin", color="CCCCCC")
        return Border(left=t, right=t, top=t, bottom=t)

    def font(bold=False, italic=False, size=10, color="1A1F1A"):
        return Font(bold=bold, italic=italic, size=size, color=color, name="Calibri")

    def align(h="left", v="center", wrap=False):
        return Alignment(horizontal=h, vertical=v, wrap_text=wrap)

    # Row 1 — title banner
    ws.merge_cells(f"A1:{last_col}1")
    c = ws["A1"]
    c.value = "Planilha de Importacao — Dashboard Fazenda"
    c.font = font(bold=True, size=14, color="FFFFFF")
    c.fill = fill("1A6B3A")
    c.alignment = align("center")
    ws.row_dimensions[1].height = 30

    # Row 2 — instruction note
    ws.merge_cells(f"A2:{last_col}2")
    c = ws["A2"]
    c.value = ("Preencha a partir da linha 6. Colunas com * sao obrigatorias. "
               "As linhas 6 a 17 sao apenas exemplos — apague-as antes de enviar.")
    c.font = font(italic=True, size=10, color="2F6B3D")
    c.fill = fill("E8F2EA")
    c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True, indent=1)
    ws.row_dimensions[2].height = 22

    # Row 3 — friendly column labels (green = required, gray = optional)
    for ci, (label, req) in enumerate(zip(col_labels, required), 1):
        c = ws.cell(row=3, column=ci, value=label)
        c.font = font(bold=True, size=10, color="FFFFFF")
        c.fill = fill("1A6B3A") if req else fill("6B7568")
        c.alignment = align("center", wrap=True)
        c.border = border()
    ws.row_dimensions[3].height = 32

    # Row 4 — technical key names (small, for reference)
    for ci, key in enumerate(col_keys, 1):
        c = ws.cell(row=4, column=ci, value=key)
        c.font = font(italic=True, size=8, color="555555")
        c.fill = fill("E8F2EA")
        c.alignment = align("center", wrap=True)
        c.border = border()
    ws.row_dimensions[4].height = 16

    # Row 5 — per-column hints
    for ci, hint in enumerate(col_hints, 1):
        c = ws.cell(row=5, column=ci, value=hint)
        c.font = font(italic=True, size=9, color="3A4438")
        c.fill = fill("F0F7F1")
        c.alignment = align("center", wrap=True)
        c.border = border()
    ws.row_dimensions[5].height = 34

    # Rows 6–17 — example data (yellow background)
    for ri, row_data in enumerate(examples, 6):
        for ci, val in enumerate(row_data, 1):
            c = ws.cell(row=ri, column=ci, value=val)
            c.fill = fill("FFFDE7")
            c.border = border()
            c.font = font(bold=(ci == 3), size=10)
            c.alignment = align("left" if ci <= 3 else "right")
        ws.row_dimensions[ri].height = 18

    # Rows 18–47 — empty input rows (very light green)
    for ri in range(18, 48):
        for ci in range(1, n_cols + 1):
            c = ws.cell(row=ri, column=ci)
            c.fill = fill("FAFFF9")
            c.border = border()
            c.alignment = align("left" if ci <= 3 else "right")
        ws.row_dimensions[ri].height = 18

    # Column widths
    for ci, w in enumerate([22, 16, 14, 10, 18, 16, 14, 14, 14, 16, 14], 1):
        ws.column_dimensions[get_column_letter(ci)].width = w

    # Freeze panes so header rows stay visible while scrolling
    ws.freeze_panes = "A6"

    # ── Sheet 2: Instrucoes ─────────────────────────────────────────────────
    wi = wb.create_sheet("Instrucoes")
    wi.column_dimensions["A"].width = 26
    wi.column_dimensions["B"].width = 70

    def wi_header(ri, text, bg):
        wi.merge_cells(f"A{ri}:B{ri}")
        c = wi.cell(row=ri, column=1, value=text)
        c.font = font(bold=True, size=11, color="FFFFFF")
        c.fill = fill(bg)
        c.alignment = align("left", wrap=True)
        wi.row_dimensions[ri].height = 22

    def wi_row(ri, label, desc, bg_a, bg_b=None):
        ca = wi.cell(row=ri, column=1, value=label)
        ca.font = font(bold=bool(desc is None), size=10)
        ca.fill = fill(bg_a)
        ca.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
        if desc is not None:
            cb = wi.cell(row=ri, column=2, value=desc)
            cb.font = font(size=10)
            cb.fill = fill(bg_b or bg_a)
            cb.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
        wi.row_dimensions[ri].height = 20

    r = 1
    wi_header(r, "GUIA DE PREENCHIMENTO — Dashboard Fazenda", "1A6B3A"); r += 1
    wi.row_dimensions[r].height = 6; r += 1

    wi_header(r, "CAMPOS OBRIGATORIOS  (marcados com *)", "1A6B3A"); r += 1
    for label, desc in [
        ("fazenda",               "Nome da fazenda. Use exatamente o mesmo nome em todos os registros."),
        ("data",                  "Data do registro. Formatos aceitos: DD/MM/AAAA (ex: 01/05/2026) ou AAAA-MM-DD (ex: 2026-05-01)."),
        ("lote",                  "Nome do lote. Exemplos comuns: TOP VACA, TOP NOV, CB1, CB2, CB4, POS PARTO. Use o mesmo nome consistentemente."),
        ("num_vacas",             "Numero total de vacas no lote nessa data. Deve ser um numero inteiro (ex: 142)."),
        ("producao_leite_total",  "Producao total de leite do lote no dia em kg (ex: 5453). E o total do lote, nao por vaca."),
        ("leite_por_vaca",        "Producao de leite por vaca no dia em kg (ex: 38.4). Normalmente = producao_leite_total / num_vacas."),
        ("consumo_ms_total",      "Consumo total de materia seca do lote no dia em kg (ex: 3522)."),
        ("consumo_ms_vaca",       "Consumo de materia seca por vaca por dia em kg (ex: 24.8). Normalmente = consumo_ms_total / num_vacas."),
        ("percentual_forragem",   "Percentual de forragem na dieta, de 0 a 100 (ex: 52.5). Meta saudavel: entre 50% e 60%."),
    ]:
        wi_row(r, label, desc, "E8F2EA"); r += 1

    wi.row_dimensions[r].height = 6; r += 1
    wi_header(r, "CAMPOS OPCIONAIS  (podem ficar em branco)", "6B7568"); r += 1
    for label, desc in [
        ("pct_ms_forragem", "Percentual de materia seca da fracao forragem (ex: 35.0). Deixe em branco se nao tiver."),
        ("pct_ms_dieta",    "Percentual de materia seca da dieta total (ex: 47.0). Deixe em branco se nao tiver."),
    ]:
        wi_row(r, label, desc, "F3F4F6"); r += 1

    wi.row_dimensions[r].height = 6; r += 1
    wi_header(r, "DICAS E ERROS COMUNS", "D97706"); r += 1
    for tip in [
        ("CORRETO",  "Cada linha representa um lote em um dia especifico."),
        ("CORRETO",  "Use ponto (.) como separador decimal, nao virgula."),
        ("CORRETO",  "Apague as linhas de exemplo (6 a 17) antes de enviar."),
        ("CORRETO",  "O sistema aceita arquivos .xlsx e .csv."),
        ("ATENCAO",  "Nao altere os nomes das colunas na planilha."),
        ("ATENCAO",  "Nao deixe celulas em branco nas colunas obrigatorias."),
        ("ATENCAO",  "Nao use formulas nas celulas — apenas valores numericos."),
    ]:
        bg = "FFFDE7" if tip[0] == "CORRETO" else "FDECEA"
        wi_row(r, tip[0], tip[1], bg); r += 1

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=template_fazenda.xlsx"})


# ──────────────────────────────────────────────
# Serve React SPA (deve ficar no final)
# ──────────────────────────────────────────────

_dist = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
if os.path.isdir(_dist):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    _assets = os.path.join(_dist, 'assets')
    if os.path.isdir(_assets):
        app.mount('/assets', StaticFiles(directory=_assets), name='assets')

    @app.get('/{full_path:path}', include_in_schema=False)
    async def serve_spa(full_path: str):
        return FileResponse(os.path.join(_dist, 'index.html'))
