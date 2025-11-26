"use client"

import { useState, useEffect } from "react"
import { Template } from "@/types/template"

interface RepoSelectorProps {
  template: Template
  onClose: () => void
}

interface Repository {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  private: boolean
  description: string | null
}

export function RepoSelector({ template, onClose }: RepoSelectorProps) {
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ phase: "", current: 0, total: 0 })
  const [result, setResult] = useState<{
    success: boolean
    issuesCreated?: number
    labelsCreated?: number
    labelsUpdated?: number
    issuesSkipped?: number
    issuesUrl?: string
    error?: string
  } | null>(null)

  useEffect(() => {
    fetchRepos()
  }, [])

  async function fetchRepos() {
    try {
      const response = await fetch("/api/repos")
      const data = await response.json()
      if (data.repos) {
        setRepos(data.repos)
      }
    } catch (error) {
      console.error("Failed to fetch repos:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!selectedRepo) return

    setGenerating(true)
    setProgress({ phase: "Starting...", current: 0, total: 100 })

    try {
      // For custom templates (from localStorage), send the entire template object
      // For built-in templates, just send the ID
      const isCustomTemplate = template.id.startsWith("custom-")

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: isCustomTemplate ? undefined : template.id,
          template: isCustomTemplate ? template : undefined,
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          issuesCreated: data.issuesCreated,
          labelsCreated: data.labelsCreated,
          labelsUpdated: data.labelsUpdated,
          issuesSkipped: data.issuesSkipped,
          issuesUrl: data.issuesUrl,
        })
      } else {
        setResult({
          success: false,
          error: data.error || "Failed to generate board",
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate board"
      setResult({
        success: false,
        error: message,
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Select Repository
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose where to generate {template.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {result ? (
            /* Success/Error State */
            <div className="text-center space-y-4">
              {result.success ? (
                <>
                  <div className="text-6xl">✅</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.issuesSkipped && result.issuesSkipped > 0
                      ? result.issuesCreated && result.issuesCreated > 0
                        ? "Board Updated Successfully!"
                        : "Board Already Up to Date!"
                      : "Board Generated Successfully!"}
                  </h3>
                  <div className="text-gray-600 dark:text-gray-400 space-y-1">
                    {result.issuesCreated && result.issuesCreated > 0 && (
                      <p>
                        ✨ Created {result.issuesCreated} new issue{result.issuesCreated !== 1 ? "s" : ""}
                      </p>
                    )}
                    {result.labelsCreated && result.labelsCreated > 0 && (
                      <p>
                        🏷️ Created {result.labelsCreated} new label{result.labelsCreated !== 1 ? "s" : ""}
                      </p>
                    )}
                    {result.labelsUpdated && result.labelsUpdated > 0 && (
                      <p>
                        🔄 Updated {result.labelsUpdated} existing label{result.labelsUpdated !== 1 ? "s" : ""}
                      </p>
                    )}
                    {result.issuesSkipped && result.issuesSkipped > 0 && (
                      <p>
                        ⏭️ Skipped {result.issuesSkipped} existing issue{result.issuesSkipped !== 1 ? "s" : ""} (no duplicates)
                      </p>
                    )}
                    {(!result.issuesCreated || result.issuesCreated === 0) && (!result.issuesSkipped || result.issuesSkipped === 0) && (
                      <p>No changes needed - all issues already exist</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <a
                      href={result.issuesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      View Issues on GitHub →
                    </a>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl">❌</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Generation Failed
                  </h3>
                  <p className="text-red-600 dark:text-red-400">
                    {result.error}
                  </p>
                  <button
                    onClick={() => setResult(null)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          ) : generating ? (
            /* Generating State */
            <div className="text-center space-y-6 py-8">
              <div className="text-6xl animate-pulse">⚡</div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Generating Your Board...
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {progress.phase}
                </p>
              </div>
              <div className="max-w-md mx-auto">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: progress.total > 0
                        ? `${(progress.current / progress.total) * 100}%`
                        : "10%",
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  This may take a minute...
                </p>
              </div>
            </div>
          ) : (
            /* Repository Selection */
            <>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading repositories...</p>
                </div>
              ) : repos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <p className="text-gray-600 dark:text-gray-400">No repositories found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
                    {repos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => setSelectedRepo(repo)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedRepo?.id === repo.id
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {repo.name}
                              </span>
                              {repo.private && (
                                <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                                  Private
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {repo.description}
                              </p>
                            )}
                          </div>
                          {selectedRepo?.id === repo.id && (
                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedRepo && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Ready to generate:</strong> {template.estimatedIssues} issues and {template.labels.length} labels will be created in{" "}
                        <span className="font-semibold">{selectedRepo.full_name}</span>
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={!selectedRepo}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                  >
                    {selectedRepo ? "Generate Board" : "Select a Repository"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
