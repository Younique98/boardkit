"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EmojiPicker } from "./template-builder/EmojiPicker"
import { Template, Phase, Issue, GitHubLabel } from "@/types/template"
import { saveCustomTemplate, updateCustomTemplate } from "@/lib/custom-templates"

interface TemplateFormProps {
  initialTemplate?: Template
  mode: "create" | "edit"
}

export function TemplateForm({ initialTemplate, mode }: TemplateFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialTemplate?.name || "")
  const [description, setDescription] = useState(initialTemplate?.description || "")
  const [icon, setIcon] = useState(initialTemplate?.icon || "📋")
  const [category, setCategory] = useState(initialTemplate?.category || "Custom")
  const [labels, setLabels] = useState<GitHubLabel[]>(initialTemplate?.labels || [])
  const [phases, setPhases] = useState<Phase[]>(initialTemplate?.phases || [])

  // Label form state
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("0052CC")
  const [newLabelDescription, setNewLabelDescription] = useState("")

  // Phase form state
  const [newPhaseName, setNewPhaseName] = useState("")
  const [newPhaseDescription, setNewPhaseDescription] = useState("")
  const [newPhaseDuration, setNewPhaseDuration] = useState("")

  const addLabel = () => {
    if (!newLabelName) return

    const label: GitHubLabel = {
      name: newLabelName,
      color: newLabelColor.replace("#", ""),
      description: newLabelDescription || "",
    }

    setLabels([...labels, label])
    setNewLabelName("")
    setNewLabelColor("0052CC")
    setNewLabelDescription("")
  }

  const removeLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index))
  }

  const addPhase = () => {
    if (!newPhaseName) return

    const phase: Phase = {
      name: newPhaseName,
      description: newPhaseDescription,
      duration: newPhaseDuration || undefined,
      issues: [],
    }

    setPhases([...phases, phase])
    setNewPhaseName("")
    setNewPhaseDescription("")
    setNewPhaseDuration("")
  }

  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index))
  }

  const addIssueToPhase = (phaseIndex: number) => {
    const newIssue: Issue = {
      title: "",
      body: "",
      labels: [],
      assignees: [],
    }

    const updatedPhases = [...phases]
    updatedPhases[phaseIndex].issues.push(newIssue)
    setPhases(updatedPhases)
  }

  const updateIssue = (
    phaseIndex: number,
    issueIndex: number,
    field: keyof Issue,
    value: string | string[]
  ) => {
    const updatedPhases = [...phases]
    updatedPhases[phaseIndex].issues[issueIndex] = {
      ...updatedPhases[phaseIndex].issues[issueIndex],
      [field]: value,
    }
    setPhases(updatedPhases)
  }

  const removeIssue = (phaseIndex: number, issueIndex: number) => {
    const updatedPhases = [...phases]
    updatedPhases[phaseIndex].issues.splice(issueIndex, 1)
    setPhases(updatedPhases)
  }

  const toggleIssueLabel = (phaseIndex: number, issueIndex: number, labelName: string) => {
    const updatedPhases = [...phases]
    const issue = updatedPhases[phaseIndex].issues[issueIndex]
    const currentLabels = issue.labels || []

    if (currentLabels.includes(labelName)) {
      issue.labels = currentLabels.filter((l) => l !== labelName)
    } else {
      issue.labels = [...currentLabels, labelName]
    }

    setPhases(updatedPhases)
  }

  const handleSubmit = () => {
    if (!name || phases.length === 0) {
      alert("Please provide a name and at least one phase")
      return
    }

    const estimatedIssues = phases.reduce((sum, phase) => sum + phase.issues.length, 0)

    const template: Template = {
      id: initialTemplate?.id || `custom-${Date.now()}`,
      name,
      description,
      icon,
      category,
      estimatedIssues,
      labels,
      phases,
    }

    try {
      if (mode === "edit" && initialTemplate) {
        updateCustomTemplate(template)
        router.push(`/templates/${template.id}`)
      } else {
        saveCustomTemplate(template)
        router.push("/")
      }
    } catch (error) {
      console.error("Error saving template:", error)
      alert("Failed to save template")
    }
  }

  const totalIssues = phases.reduce((sum, phase) => sum + phase.issues.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {mode === "edit" ? "Edit Template" : "Create Custom Template"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalIssues} issues • {labels.length} labels • {phases.length} phases
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                {mode === "edit" ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Template Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Template Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Icon
              </label>
              <EmojiPicker value={icon} onChange={setIcon} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="My Awesome Template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Describe your template..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Custom"
              />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Labels</h2>

          <div className="space-y-4 mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Label name"
              />
              <input
                type="text"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value.replace("#", ""))}
                className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0052CC"
              />
              <div
                className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: `#${newLabelColor}` }}
              />
              <button
                onClick={addLabel}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            <input
              type="text"
              value={newLabelDescription}
              onChange={(e) => setNewLabelDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Label description (optional)"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {labels.map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded"
                style={{
                  backgroundColor: `#${label.color}20`,
                  color: `#${label.color}`,
                  border: `1px solid #${label.color}40`,
                }}
              >
                {label.name}
                <button
                  onClick={() => removeLabel(index)}
                  className="hover:opacity-70"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Phases */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Phases & Issues
          </h2>

          {/* Add Phase Form */}
          <div className="space-y-3 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <input
              type="text"
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Phase name *"
            />
            <input
              type="text"
              value={newPhaseDescription}
              onChange={(e) => setNewPhaseDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Phase description"
            />
            <div className="flex gap-3">
              <input
                type="text"
                value={newPhaseDuration}
                onChange={(e) => setNewPhaseDuration(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Duration (optional)"
              />
              <button
                onClick={addPhase}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add Phase
              </button>
            </div>
          </div>

          {/* Phases List */}
          <div className="space-y-6">
            {phases.map((phase, phaseIndex) => (
              <div
                key={phaseIndex}
                className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {phase.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {phase.description}
                    </p>
                    {phase.duration && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Duration: {phase.duration}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removePhase(phaseIndex)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Remove Phase
                  </button>
                </div>

                {/* Issues in Phase */}
                <div className="space-y-3">
                  {phase.issues.map((issue, issueIndex) => (
                    <div
                      key={issueIndex}
                      className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-3"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={issue.title}
                          onChange={(e) =>
                            updateIssue(phaseIndex, issueIndex, "title", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder="Issue title"
                        />
                        <button
                          onClick={() => removeIssue(phaseIndex, issueIndex)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        value={issue.body}
                        onChange={(e) =>
                          updateIssue(phaseIndex, issueIndex, "body", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        rows={3}
                        placeholder="Issue description (supports markdown)"
                      />
                      <div className="flex flex-wrap gap-2">
                        {labels.map((label) => (
                          <button
                            key={label.name}
                            onClick={() =>
                              toggleIssueLabel(phaseIndex, issueIndex, label.name)
                            }
                            className={`px-2 py-1 text-xs font-medium rounded transition-opacity ${
                              issue.labels?.includes(label.name)
                                ? "opacity-100"
                                : "opacity-40 hover:opacity-60"
                            }`}
                            style={{
                              backgroundColor: `#${label.color}20`,
                              color: `#${label.color}`,
                              border: `1px solid #${label.color}40`,
                            }}
                          >
                            {label.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addIssueToPhase(phaseIndex)}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                  >
                    + Add Issue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
