"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function ImportTemplatePage() {
  const router = useRouter()
  const { status } = useSession()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationInfo, setValidationInfo] = useState<{
    rowCount?: number
    columnCount?: number
    delimiter?: string
  } | null>(null)

  // Redirect to sign in if not authenticated
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

  const detectDelimiter = (text: string): string => {
    const firstLine = text.split("\n")[0]
    const delimiters = [",", ";", "\t", "|"]

    let maxCount = 0
    let detectedDelimiter = ","

    for (const delimiter of delimiters) {
      const count = firstLine.split(delimiter).length
      if (count > maxCount) {
        maxCount = count
        detectedDelimiter = delimiter
      }
    }

    return detectedDelimiter
  }

  const validateCSV = async (selectedFile: File): Promise<boolean> => {
    setError(null)
    setValidationInfo(null)

    try {
      const text = await selectedFile.text()

      // Check if file is empty
      if (!text || text.trim().length === 0) {
        setError("The CSV file is empty. Please upload a file with data.")
        return false
      }

      // Split into lines and remove empty lines
      const lines = text.split("\n").filter((line) => line.trim().length > 0)

      // Check if there are at least 2 lines (header + data)
      if (lines.length < 2) {
        setError("The CSV file needs at least a header row and one data row. Please add more data.")
        return false
      }

      // Detect delimiter
      const delimiter = detectDelimiter(text)
      const delimiterName =
        delimiter === "," ? "comma" :
        delimiter === ";" ? "semicolon" :
        delimiter === "\t" ? "tab" :
        "pipe"

      // Parse header
      const headerLine = lines[0]
      const headers = headerLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""))

      // Check if headers exist
      if (headers.length === 0 || headers.every((h) => !h)) {
        setError("No column headers detected. The first row should contain column names like 'Phase', 'Title', 'Description'.")
        return false
      }

      // Check if we have at least one header that looks like it could be a title
      const hasPotentialTitleColumn = headers.some((h) =>
        h.toLowerCase().includes("title") ||
        h.toLowerCase().includes("name") ||
        h.toLowerCase().includes("task") ||
        h.toLowerCase().includes("issue")
      )

      if (!hasPotentialTitleColumn) {
        setError(
          `No 'Title' column detected. Found columns: ${headers.join(", ")}. ` +
          "Please ensure you have a column for issue titles."
        )
        return false
      }

      // Set validation info
      setValidationInfo({
        rowCount: lines.length - 1, // excluding header
        columnCount: headers.length,
        delimiter: delimiterName,
      })

      return true
    } catch {
      setError("Failed to read the CSV file. Please ensure it's a valid text file.")
      return false
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile)
        await validateCSV(droppedFile)
      } else {
        setError("Please upload a CSV file (.csv extension)")
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile)
        await validateCSV(selectedFile)
      } else {
        setError("Please upload a CSV file (.csv extension)")
      }
    }
  }

  const handleNext = () => {
    if (file && !error && validationInfo) {
      // Read and parse CSV file
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        // Store in sessionStorage for next step
        sessionStorage.setItem("csvData", text)
        sessionStorage.setItem("csvFileName", file.name)
        router.push("/templates/import/map")
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Import from Spreadsheet
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload a CSV file to generate issues from your data
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-3">
            📊 CSV Format Requirements
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-300 text-sm">
            <li>• CSV file should have headers in the first row</li>
            <li>• Recommended columns: Phase, Title, Description, Labels</li>
            <li>• Labels can be comma-separated (e.g., &quot;bug, high-priority&quot;)</li>
            <li>• All rows should belong to phases that will be created</li>
          </ul>
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700 font-mono text-xs overflow-x-auto">
            <div className="text-gray-600 dark:text-gray-400">Example CSV:</div>
            <pre className="text-gray-900 dark:text-gray-100 mt-2">
Phase,Title,Description,Labels
Phase 1,Setup database,Create PostgreSQL schema,&quot;backend,database&quot;
Phase 1,Setup API,Create Express.js server,&quot;backend,api&quot;
Phase 2,Create UI,Build React components,&quot;frontend,ui&quot;
            </pre>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Upload CSV File
          </h2>

          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : error
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : validationInfo
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="text-6xl">
                {error ? "❌" : validationInfo ? "✅" : "📊"}
              </div>
              {file ? (
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>

                  {/* Error Message */}
                  {error && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-red-500">
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Validation Info */}
                  {validationInfo && !error && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-green-500">
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">
                        ✓ CSV file validated successfully!
                      </p>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <p>• {validationInfo.rowCount} data rows detected</p>
                        <p>• {validationInfo.columnCount} columns found</p>
                        <p>• Delimiter: {validationInfo.delimiter}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setFile(null)
                      setError(null)
                      setValidationInfo(null)
                    }}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Drag and drop your CSV file here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    or click to browse
                  </p>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer transition-colors inline-block">
                      Choose File
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {file && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNext}
                disabled={!!error || !validationInfo}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg ${
                  error || !validationInfo
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl"
                }`}
              >
                Next: Map Columns →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
