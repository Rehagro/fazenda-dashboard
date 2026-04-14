import React, { useCallback, useState } from 'react'
import { X, Upload, CheckCircle, AlertCircle, FileSpreadsheet, Download } from 'lucide-react'
import { uploadFile, templateUrl, templateCsvUrl } from '../api/client'

export default function UploadModal({ open, onClose, onSuccess }) {
  const [file,     setFile]     = useState(null)
  const [dragging, setDragging] = useState(false)
  const [status,   setStatus]   = useState('idle')   // idle | uploading | success | error
  const [message,  setMessage]  = useState('')

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      setStatus('error')
      setMessage('Apenas arquivos .xlsx, .xls ou .csv são aceitos.')
      return
    }
    setFile(f)
    setStatus('idle')
    setMessage('')
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setStatus('uploading')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadFile(fd)
      const fazInfo = res.fazendas?.length
        ? ` — Fazendas: ${res.fazendas.join(', ')}`
        : ''
      setStatus('success')
      setMessage(`${res.message} (${res.records_inserted} registros${fazInfo})`)
      onSuccess?.()
      setTimeout(() => { onClose(); resetState() }, 2500)
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.detail || 'Erro ao fazer upload.')
    }
  }

  const resetState  = () => { setFile(null); setStatus('idle'); setMessage('') }
  const handleClose = () => { resetState(); onClose() }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Upload de Dados</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Envie um arquivo Excel ou CSV com produção e consumo
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('upload-file-input').click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${dragging ? 'border-brand-500 bg-brand-50'
                : file   ? 'border-brand-400 bg-brand-50'
                         : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'}
            `}
          >
            <input
              id="upload-file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="w-10 h-10 text-brand-600" />
                <p className="font-semibold text-brand-700">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-gray-300" />
                <p className="font-medium text-gray-700">
                  Arraste o arquivo aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-400">Formatos: .xlsx, .xls, .csv</p>
              </div>
            )}
          </div>

          {/* Status */}
          {status === 'success' && (
            <div className="flex items-start gap-2 text-emerald-700 bg-emerald-50 rounded-lg p-3 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {message}
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-start gap-2 text-red-700 bg-red-50 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {message}
            </div>
          )}

          {/* Template links */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>Baixar template:</span>
            <a href={templateUrl} className="text-brand-600 hover:underline font-medium inline-flex items-center gap-1">
              <Download className="w-3 h-3" /> Excel
            </a>
            <a href={templateCsvUrl} className="text-brand-600 hover:underline font-medium inline-flex items-center gap-1">
              <Download className="w-3 h-3" /> CSV
            </a>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleClose} className="btn-ghost flex-1 justify-center">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || status === 'uploading'}
              className="btn-primary flex-1 justify-center"
            >
              {status === 'uploading' ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Enviando…
                </span>
              ) : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
