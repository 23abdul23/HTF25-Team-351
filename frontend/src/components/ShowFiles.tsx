"use client"

import { useState, useEffect } from "react"
import { AlertCircle, FileIcon, Loader2 } from "lucide-react"

interface File {
  id: string
  name: string
  size: number
  uploadedAt: string
}

export default function ShowFiles() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:5000/files")
        if (!response.ok) {
          throw new Error("Failed to fetch files")
        }
        const data = await response.json()
        setFiles(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setFiles([])
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600 font-medium">Loading files...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Files</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Files</h1>
          <p className="text-slate-600">
            {files.length} {files.length === 1 ? "file" : "files"} available
          </p>
        </div>

        {/* Files List */}
        {files.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No files found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ul className="divide-y divide-slate-200">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="p-4 hover:bg-slate-50 transition-colors duration-150 flex items-center gap-3"
                >
                  <FileIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024).toFixed(2)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

