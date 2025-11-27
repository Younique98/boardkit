"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Template, Phase, GitHubLabel } from "@/types/template"
import { RepoSelector } from "@/components/repo-selector"

interface ColumnMapping {
  phase: string
  title: string
  body: string
  labels: string
}

interface ParsedIssue {
  phase: string
  title: string
  body: string
  labels: string[]
}

export default function PreviewImportPage() {
  const router = useRouter()
  const { status } = useSession()
  const [parsedIssues, setParsedIssues] = useState<ParsedIssue[]>([])
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load data from sessionStorage
    const csvData = sessionStorage.getItem("csvData")
    const mappingData = sessionStorage.getItem("csvMapping")
    const name = sessionStorage.getItem("csvFileName")

    if (!csvData || !mappingData) {
      router.push("/templates/import")
      return
    }

    const mapping: ColumnMapping = JSON.parse(mappingData)

    // Parse CSV
    const lines = csvData.split("\n").filter((line) => line.trim())
    if (lines.length === 0) {
      router.push("/templates/import")
      return
    }

    const headers = parseCSVLine(lines[0])
    const rows = lines.slice(1).map((line) => parseCSVLine(line))

    // Get column indices
    const phaseIdx = mapping.phase ? headers.indexOf(mapping.phase) : -1
    const titleIdx = headers.indexOf(mapping.title)
    const bodyIdx = mapping.body ? headers.indexOf(mapping.body) : -1
    const labelsIdx = mapping.labels ? headers.indexOf(mapping.labels) : -1

    // Parse issues
    const issues: ParsedIssue[] = rows
      .filter((row) => row[titleIdx] && row[titleIdx].trim())
      .map((row) => {
        const labelsStr = labelsIdx !== -1 ? row[labelsIdx] : ""
        const labels = labelsStr
          ? labelsStr
              .split(",")
              .map((l) => l.trim())
              .filter((l) => l)
          : []

        return {
          phase: phaseIdx !== -1 ? row[phaseIdx] || "Default Phase" : "Default Phase",
          title: row[titleIdx],
          body: bodyIdx !== -1 ? row[bodyIdx] || "" : "",
          labels,
        }
      })

    setParsedIssues(issues)

    // Create template from parsed data
    const uniquePhaseNames = Array.from(new Set(issues.map((i) => i.phase)))
    const phases: Phase[] = uniquePhaseNames.map((phaseName) => {
      const phaseIssues = issues.filter((i) => i.phase === phaseName)
      return {
        name: phaseName,
        description: `Imported from ${name}`,
        issues: phaseIssues.map((issue) => ({
          title: issue.title,
          body: issue.body,
          labels: issue.labels,
          assignees: [],
        })),
      }
    })

    // Extract unique labels
    const allLabels = Array.from(new Set(issues.flatMap((i) => i.labels)))
    const labels: GitHubLabel[] = allLabels.map((labelName) => ({
      name: labelName,
      color: generateColorFromString(labelName),
      description: "",
    }))

    const generatedTemplate: Template = {
      id: `import-${Date.now()}`,
      name: `Imported from ${name}`,
      description: `Template generated from CSV import`,
      icon: "📊",
      category: "Imported",
      estimatedIssues: issues.length,
      labels,
      phases,
    }

    setTemplate(generatedTemplate)
    setLoading(false)
  }, [router])

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/")
    return null
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            Failed to parse CSV data
          </div>
          <button
            onClick={() => router.push("/templates/import")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

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

  function generateColorFromString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const color = Math.abs(hash).toString(16).substring(0, 6).padStart(6, "0")
    return color.toUpperCase()
  }

  const groupedByPhase = parsedIssues.reduce(
    (acc, issue) => {
      if (!acc[issue.phase]) {
        acc[issue.phase] = []
      }
      acc[issue.phase].push(issue)
      return acc
    },
    {} as Record<string, ParsedIssue[]>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Preview Import
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {parsedIssues.length} issues • {Object.keys(groupedByPhase).length} phases •{" "}
                {template.labels.length} labels
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Summary */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-green-900 dark:text-green-200 mb-2">
            ✓ Ready to Import
          </h3>
          <p className="text-green-800 dark:text-green-300 text-sm">
            Your CSV has been successfully parsed. Review the issues below and select a repository
            to generate them.
          </p>
        </div>

        {/* Repository Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Select Repository
          </h2>
          <RepoSelector template={template} onClose={() => {}} />
        </div>

        {/* Labels Preview */}
        {template.labels.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Labels ({template.labels.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {template.labels.map((label, index) => (
                <span
                  key={index}
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

        {/* Issues by Phase */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Issues by Phase
          </h2>

          {Object.entries(groupedByPhase).map(([phaseName, issues]) => (
            <div
              key={phaseName}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{phaseName}</h3>
                <span className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  {issues.length} issue{issues.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {issue.title}
                    </h4>
                    {issue.body && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {issue.body.length > 150
                          ? `${issue.body.substring(0, 150)}...`
                          : issue.body}
                      </p>
                    )}
                    {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {issue.labels.map((label, labelIdx) => {
                          const labelObj = template.labels.find((l) => l.name === label)
                          return (
                            <span
                              key={labelIdx}
                              className="px-2 py-0.5 text-xs font-medium rounded"
                              style={
                                labelObj
                                  ? {
                                      backgroundColor: `#${labelObj.color}20`,
                                      color: `#${labelObj.color}`,
                                      border: `1px solid #${labelObj.color}40`,
                                    }
                                  : {}
                              }
                            >
                              {label}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
