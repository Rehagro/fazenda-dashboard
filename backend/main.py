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

    df["data"] = pd.to_datetime(df["data"]).dt.date
    df["eficiencia_alimentar"] = (df["leite_por_vaca"] / df["consumo_ms_vaca"]).round(4)
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
    headers_list = [
        "fazenda", "data", "lote", "num_vacas",
        "producao_leite_total", "leite_por_vaca",
        "consumo_ms_total", "consumo_ms_vaca",
        "percentual_forragem", "pct_ms_forragem", "pct_ms_dieta",
    ]
    subtitles = [
        "Nome da Fazenda", "AAAA-MM-DD", "Nome do Lote", "Nº de vacas",
        "kg leite total", "kg leite/vaca/dia",
        "kg MS total", "kg MS/vaca/dia",
        "% forragem (0–100)", "% MS forragem (ex: 30.5)", "% MS dieta (ex: 45.0)",
    ]
    examples = [
        ["Fazenda Teste", "2026-01-01", "TOP VACA", 48, 1900, 39.6, 1248, 26.0, 50.0, 30.0, 44.5],
        ["Fazenda Teste", "2026-01-01", "CB1",      60, 1980, 33.0, 1380, 23.0, 54.0, 31.5, 46.0],
    ]

    if fmt == "csv":
        import csv
        from io import StringIO
        buf = StringIO()
        csv.writer(buf).writerows([headers_list] + examples)
        buf.seek(0)
        return StreamingResponse(
            iter([buf.getvalue().encode("utf-8-sig")]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=template_fazenda.csv"},
        )

    import openpyxl
    from openpyxl.styles import Alignment, Font, PatternFill
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Nutrição"
    green = PatternFill("solid", fgColor="1A6B3A")
    gray  = PatternFill("solid", fgColor="F3F4F6")
    for ci, (h, s) in enumerate(zip(headers_list, subtitles), 1):
        c = ws.cell(row=1, column=ci, value=h)
        c.font = Font(bold=True, color="FFFFFF"); c.fill = green
        c.alignment = Alignment(horizontal="center")
        sub = ws.cell(row=2, column=ci, value=s)
        sub.font = Font(italic=True, color="555555", size=9); sub.fill = gray
    for ri, row in enumerate(examples, 3):
        for ci, val in enumerate(row, 1):
            ws.cell(row=ri, column=ci, value=val)
    for col in ws.columns:
        ws.column_dimensions[col[0].column_letter].width = 24
    buf = io.BytesIO()
    wb.save(buf); buf.seek(0)
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
