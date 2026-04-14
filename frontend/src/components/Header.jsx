import React from 'react'
import { Upload, Download, Milk } from 'lucide-react'
import { templateUrl } from '../api/client'

export default function Header({ onUploadClick }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <Milk className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight text-lg">
              Fazenda Dashboard
            </h1>
            <p className="text-xs text-gray-400 leading-tight hidden sm:block">
              Nutrição Pecuária Leiteira
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href={templateUrl}
            className="btn-ghost text-sm hidden sm:inline-flex"
          >
            <Download className="w-4 h-4" />
            Template Excel
          </a>
          <button
            onClick={onUploadClick}
            className="btn-primary text-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Excel
          </button>
        </div>
      </div>
    </header>
  )
}
