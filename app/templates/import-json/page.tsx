"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Template } from "@/types/template"
import { saveCustomTemplate } from "@/lib/custom-templates"

export default function ImportJSONPage() {
  const router = useRouter()
  const { status } = useSession()
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [jsonText, setJsonText] = useState<string>("")
  const [dragActive, setDragActive] = useState(false)
  const [template, setTemplate] = useState<Template | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateTemplate = (data: unknown): data is Template => {
    if (typeof data !== "object" || data === null) return false

    const t = data as Record<string, unknown>

    // Check required fields
    if (typeof t.name !== "string" || !t.name) return false
    if (typeof t.description !== "string") return false
    if (typeof t.icon !== "string") return false
    if (typeof t.category !== "string") return false
    if (!Array.isArray(t.labels)) return false
    if (!Array.isArray(t.phases)) return false

    // Validate labels
    for (const label of t.labels) {
      if (typeof label !== "object" || label === null) return false
      const l = label as Record<string, unknown>
      if (typeof l.name !== "string" || typeof l.color !== "string") return false
    }

    // Validate phases
    for (const phase of t.phases) {
      if (typeof phase !== "object" || phase === null) return false
      const p = phase as Record<string, unknown>
      if (typeof p.name !== "string" || !Array.isArray(p.issues)) return false
    }

    return true
  }

  const handleFile = async (selectedFile: File) => {
    setError(null)
    setTemplate(null)

    if (!selectedFile.name.endsWith(".json")) {
      setError("Please upload a JSON file")
      return
    }

    try {
      const text = await selectedFile.text()
      const data = JSON.parse(text)

      if (!validateTemplate(data)) {
        setError("Invalid template format. Please ensure the JSON file contains a valid BoardKit template.")
        return
      }

      // Generate new ID for imported template
      const importedTemplate: Template = {
        ...data,
        id: `custom-${Date.now()}`,
        category: data.category || "Imported",
      }

      setTemplate(importedTemplate)
      setShowPreview(true)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON file. Please check the file format.")
      } else {
        setError("Failed to read file. Please try again.")
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      handleFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      handleFile(selectedFile)
    }
  }

  const handlePasteJSON = () => {
    setError(null)
    setTemplate(null)

    if (!jsonText || jsonText.trim().length === 0) {
      setError("Please paste JSON content")
      return
    }

    try {
      const data = JSON.parse(jsonText)

      if (!validateTemplate(data)) {
        setError("Invalid template format. Please ensure the JSON contains a valid BoardKit template.")
        return
      }

      // Generate new ID for imported template
      const importedTemplate: Template = {
        ...data,
        id: `custom-${Date.now()}`,
        category: data.category || "Imported",
      }

      setTemplate(importedTemplate)
      setShowPreview(true)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON format. Please check your JSON syntax.")
      } else {
        setError("Failed to parse JSON. Please try again.")
      }
    }
  }

  const handleSave = () => {
    if (template) {
      try {
        saveCustomTemplate(template)
        router.push("/")
      } catch {
        setError("Failed to save template")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Import Template from JSON
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload a file or paste JSON directly
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
            📦 Import Templates
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-300 text-sm">
            <li>• Upload JSON files or paste JSON directly</li>
            <li>• Share templates by copying and pasting JSON</li>
            <li>• Templates will be validated before importing</li>
            <li>• Preview templates before saving</li>
          </ul>
        </div>

        {/* Upload/Paste Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setInputMode("upload")
                setError(null)
                setTemplate(null)
                setJsonText("")
              }}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                inputMode === "upload"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              📁 Upload File
            </button>
            <button
              onClick={() => {
                setInputMode("paste")
                setError(null)
                setTemplate(null)
                setFile(null)
              }}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                inputMode === "paste"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              📋 Paste JSON
            </button>
          </div>

          {/* Upload Mode */}
          {inputMode === "upload" && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : error
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
            <div className="space-y-4">
              <div className="text-6xl">{error ? "❌" : "📦"}</div>
              {file && !error ? (
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  {template && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                      ✓ Valid template format detected
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setFile(null)
                      setTemplate(null)
                      setError(null)
                      setShowPreview(false)
                    }}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {error || "Drag and drop your JSON file here"}
                  </p>
                  {!error && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      or click to browse
                    </p>
                  )}
                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".json,application/json"
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
          )}

          {/* Paste Mode */}
          {inputMode === "paste" && (
            <div className="space-y-4">
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value)
                  setError(null)
                }}
                placeholder="Paste your JSON template here...&#10;&#10;Example:&#10;{&#10;  &quot;name&quot;: &quot;My Template&quot;,&#10;  &quot;description&quot;: &quot;...&quot;,&#10;  ...&#10;}"
                className={`w-full h-96 px-4 py-3 font-mono text-sm border-2 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-y ${
                  error
                    ? "border-red-500 focus:ring-2 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                }`}
              />

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setJsonText("")
                    setError(null)
                    setTemplate(null)
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handlePasteJSON}
                  disabled={!jsonText.trim()}
                  className={`flex-1 px-6 py-2 rounded-lg font-semibold transition-colors ${
                    jsonText.trim()
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Validate & Preview
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        {template && showPreview && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Template Preview
            </h2>

            <div className="space-y-6">
              {/* Template Info */}
              <div className="flex items-start gap-4">
                <div className="text-5xl">{template.icon}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>📋 {template.estimatedIssues} issues</span>
                    <span>🏷️ {template.labels.length} labels</span>
                    <span>📦 {template.phases.length} phases</span>
                  </div>
                </div>
              </div>

              {/* Labels */}
              {template.labels.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Labels</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.labels.map((label, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-sm font-medium rounded"
                        style={{
                          backgroundColor: `#${label.color}20`,
                          color: `#${label.color}`,
                          border: `1px solid #${label.color}40`,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Phases */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Phases</h4>
                <div className="space-y-2">
                  {template.phases.map((phase, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{phase.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {phase.issues.length} issue{phase.issues.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
