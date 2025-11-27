"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface ColumnMapping {
  phase: string
  title: string
  body: string
  labels: string
}

export default function MapColumnsPage() {
  const router = useRouter()
  const { status } = useSession()
  const [fileName, setFileName] = useState<string>("")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    phase: "",
    title: "",
    body: "",
    labels: "",
  })

  useEffect(() => {
    // Load CSV data from sessionStorage
    const data = sessionStorage.getItem("csvData")
    const name = sessionStorage.getItem("csvFileName")

    if (!data) {
      router.push("/templates/import")
      return
    }

    setFileName(name || "file.csv")

    // Parse CSV
    const lines = data.split("\n").filter((line) => line.trim())
    if (lines.length > 0) {
      // Parse headers
      const headerLine = lines[0]
      const parsedHeaders = parseCSVLine(headerLine)
      setHeaders(parsedHeaders)

      // Parse rows
      const parsedRows = lines.slice(1).map((line) => parseCSVLine(line))
      setRows(parsedRows)

      // Auto-detect common column names
      const lowerHeaders = parsedHeaders.map((h) => h.toLowerCase())
      const autoMapping: ColumnMapping = {
        phase: "",
        title: "",
        body: "",
        labels: "",
      }

      // Auto-map phase
      const phaseIdx = lowerHeaders.findIndex((h) =>
        ["phase", "milestone", "sprint", "stage"].includes(h)
      )
      if (phaseIdx !== -1) autoMapping.phase = parsedHeaders[phaseIdx]

      // Auto-map title
      const titleIdx = lowerHeaders.findIndex((h) =>
        ["title", "name", "task", "issue", "summary"].includes(h)
      )
      if (titleIdx !== -1) autoMapping.title = parsedHeaders[titleIdx]

      // Auto-map body
      const bodyIdx = lowerHeaders.findIndex((h) =>
        ["body", "description", "details", "notes", "content"].includes(h)
      )
      if (bodyIdx !== -1) autoMapping.body = parsedHeaders[bodyIdx]

      // Auto-map labels
      const labelsIdx = lowerHeaders.findIndex((h) =>
        ["labels", "tags", "categories", "types"].includes(h)
      )
      if (labelsIdx !== -1) autoMapping.labels = parsedHeaders[labelsIdx]

      setMapping(autoMapping)
    }
  }, [router])

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/")
    return null
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  // Simple CSV parser that handles quoted fields
  function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    result.push(current.trim())

    return result
  }

  const handleNext = () => {
    // Validate mapping
    if (!mapping.title) {
      alert("Please map the Title field - it is required")
      return
    }

    // Store mapping in sessionStorage
    sessionStorage.setItem("csvMapping", JSON.stringify(mapping))
    router.push("/templates/import/preview")
  }

  const isValid = mapping.title !== ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Map Columns
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {fileName} • {rows.length} rows found
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!isValid}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  isValid
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                }`}
              >
                Next: Preview →
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-2">
            🎯 Map Your Columns
          </h3>
          <p className="text-blue-800 dark:text-blue-300 text-sm">
            Match your CSV columns to issue fields. Title is required, others are optional.
          </p>
        </div>

        {/* Mapping Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Column Mapping
          </h2>

          <div className="space-y-6">
            {/* Phase Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phase / Milestone (optional)
              </label>
              <select
                value={mapping.phase}
                onChange={(e) => setMapping({ ...mapping, phase: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">-- Not mapped --</option>
                {headers.map((header, idx) => (
                  <option key={idx} value={header}>
                    {header}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Column that contains the phase or milestone name
              </p>
            </div>

            {/* Title Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Issue Title *
              </label>
              <select
                value={mapping.title}
                onChange={(e) => setMapping({ ...mapping, title: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  !mapping.title
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">-- Select column --</option>
                {headers.map((header, idx) => (
                  <option key={idx} value={header}>
                    {header}
                  </option>
                ))}
              </select>
              {!mapping.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Title is required
                </p>
              )}
            </div>

            {/* Body Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Issue Description (optional)
              </label>
              <select
                value={mapping.body}
                onChange={(e) => setMapping({ ...mapping, body: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">-- Not mapped --</option>
                {headers.map((header, idx) => (
                  <option key={idx} value={header}>
                    {header}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Column that contains detailed description
              </p>
            </div>

            {/* Labels Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Labels (optional)
              </label>
              <select
                value={mapping.labels}
                onChange={(e) => setMapping({ ...mapping, labels: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">-- Not mapped --</option>
                {headers.map((header, idx) => (
                  <option key={idx} value={header}>
                    {header}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Column with comma-separated labels (e.g., &quot;bug, high-priority&quot;)
              </p>
            </div>
          </div>
        </div>

        {/* Preview of first few rows */}
        {rows.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Preview (First 3 Rows)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    {headers.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rows.slice(0, 3).map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                        >
                          {cell || <span className="text-gray-400 italic">empty</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 3 && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                + {rows.length - 3} more rows
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
