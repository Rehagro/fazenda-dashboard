import React from 'react'
import { FileSpreadsheet, Calendar, Hash } from 'lucide-react'

export default function UploadHistory({ uploads, loading }) {
  if (loading) {
    return (
      <div className="card space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!uploads?.length) {
    return (
      <div className="card text-center py-12">
        <FileSpreadsheet className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400">Nenhum upload encontrado</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left font-semibold text-gray-600 px-5 py-3">#</th>
              <th className="text-left font-semibold text-gray-600 px-5 py-3">Arquivo</th>
              <th className="text-left font-semibold text-gray-600 px-5 py-3">Data do Upload</th>
              <th className="text-right font-semibold text-gray-600 px-5 py-3">Registros</th>
              <th className="text-left font-semibold text-gray-600 px-5 py-3">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {uploads.map((u, i) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="font-medium text-gray-800">{u.filename}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(u.uploaded_at).toLocaleString('pt-BR')}
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="badge bg-brand-100 text-brand-700 border border-brand-200">
                    {u.num_records}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400 italic text-xs">{u.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
