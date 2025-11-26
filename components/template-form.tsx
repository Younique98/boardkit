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

// Preset colors for quick selection
const PRESET_COLORS = [
  { name: "Blue", color: "0052CC" },
  { name: "Red", color: "FF5630" },
  { name: "Green", color: "36B37E" },
  { name: "Yellow", color: "FFAB00" },
  { name: "Purple", color: "6554C0" },
  { name: "Pink", color: "FF79C6" },
  { name: "Orange", color: "FF8B00" },
  { name: "Teal", color: "00B8D9" },
  { name: "Gray", color: "6B778C" },
  { name: "Lime", color: "79F2C0" },
]

export function TemplateForm({ initialTemplate, mode }: TemplateFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialTemplate?.name || "")
  const [description, setDescription] = useState(initialTemplate?.description || "")
  const [icon, setIcon] = useState(initialTemplate?.icon || "📋")
  const [category, setCategory] = useState(initialTemplate?.category || "Custom")
  const [labels, setLabels] = useState<GitHubLabel[]>(initialTemplate?.labels || [])
  const [phases, setPhases] = useState<Phase[]>(initialTemplate?.phases || [])
  const [showPreview, setShowPreview] = useState(false)

  // Label form state
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("0052CC")
  const [newLabelDescription, setNewLabelDescription] = useState("")

  // Phase form state
  const [newPhaseName, setNewPhaseName] = useState("")
  const [newPhaseDescription, setNewPhaseDescription] = useState("")
  const [newPhaseDuration, setNewPhaseDuration] = useState("")

  const suggestUnusedColor = () => {
    // Get all currently used colors
    const usedColors = labels.map((l) => l.color.toLowerCase())

    // Find first preset color that's not used
    const unusedPreset = PRESET_COLORS.find(
      (preset) => !usedColors.includes(preset.color.toLowerCase())
    )

    if (unusedPreset) {
      setNewLabelColor(unusedPreset.color)
    } else {
      // All presets used, generate random color
      const randomColor = Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")
        .toUpperCase()
      setNewLabelColor(randomColor)
    }
  }

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
                onClick={() => setShowPreview(true)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                👁️ Preview
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
            {/* Label Name */}
            <input
              type="text"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Label name *"
            />

            {/* Color Selection Row */}
            <div className="flex gap-3 items-center">
              <div className="flex-1 flex gap-2 items-center">
                {/* Native Color Picker */}
                <input
                  type="color"
                  value={`#${newLabelColor}`}
                  onChange={(e) => setNewLabelColor(e.target.value.replace("#", ""))}
                  className="w-12 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                  title="Pick a color"
                />

                {/* Hex Input */}
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-gray-500 dark:text-gray-400">#</span>
                  <input
                    type="text"
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value.replace("#", ""))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    placeholder="0052CC"
                    maxLength={6}
                  />
                </div>

                {/* Suggest Color Button */}
                <button
                  type="button"
                  onClick={suggestUnusedColor}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors whitespace-nowrap"
                  title="Suggest an unused color"
                >
                  🎨 Suggest
                </button>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={addLabel}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Add Label
              </button>
            </div>

            {/* Preset Colors */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 self-center mr-2">
                Quick colors:
              </span>
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => setNewLabelColor(preset.color)}
                  className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-gray-900 dark:hover:border-gray-100 transition-colors"
                  style={{ backgroundColor: `#${preset.color}` }}
                  title={preset.name}
                />
              ))}
            </div>

            {/* Label Description */}
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

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8">
            <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
              {/* Preview Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl p-6 z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Template Preview
                  </h2>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                  >
                    ← Back to Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowPreview(false)
                      handleSubmit()
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    {mode === "edit" ? "Save Changes" : "Create Template"}
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-8 space-y-8">
                {/* Template Header */}
                <div className="flex items-start gap-6">
                  <div className="text-7xl">{icon || "📋"}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                          {name || "Untitled Template"}
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                          {description || "No description provided"}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        {category}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {totalIssues} issues
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {labels.length} labels
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {phases.length} phases
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phases */}
                {phases.length > 0 ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Project Phases
                    </h2>

                    {phases.map((phase, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {phase.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {phase.description}
                            </p>
                          </div>
                          {phase.duration && (
                            <span className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                              {phase.duration}
                            </span>
                          )}
                        </div>

                        {phase.issues.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              {phase.issues.length} issue{phase.issues.length !== 1 ? "s" : ""} in this phase:
                            </p>
                            <ul className="grid sm:grid-cols-2 gap-2">
                              {phase.issues.slice(0, 6).map((issue, issueIndex) => (
                                <li
                                  key={issueIndex}
                                  className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2"
                                >
                                  <span className="text-blue-500 mt-1">→</span>
                                  <span className="flex-1">{issue.title || "Untitled Issue"}</span>
                                </li>
                              ))}
                              {phase.issues.length > 6 && (
                                <li className="text-sm text-gray-500 dark:text-gray-400 italic">
                                  + {phase.issues.length - 6} more issues...
                                </li>
                              )}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No issues in this phase yet
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      No phases added yet. Add at least one phase to create your template.
                    </p>
                  </div>
                )}

                {/* Labels Preview */}
                {labels.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Labels
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {labels.map((label, index) => (
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
