"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { EmojiPicker } from "@/components/template-builder/EmojiPicker"
import { saveCustomTemplate } from "@/lib/custom-templates"
import { Template, GitHubLabel, Issue } from "@/types/template"

export default function CreateTemplatePage() {
  const router = useRouter()

  // Template info
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [templateIcon, setTemplateIcon] = useState("📋")
  const [templateCategory, setTemplateCategory] = useState("Custom")

  // Labels
  const [labels, setLabels] = useState<GitHubLabel[]>([
    { name: "priority-high", color: "FF0000", description: "High priority" },
    { name: "priority-medium", color: "FFA500", description: "Medium priority" },
    { name: "priority-low", color: "FFFF00", description: "Low priority" },
  ])
  const [newLabel, setNewLabel] = useState({ name: "", color: "0052CC", description: "" })

  // Phases
  const [phases, setPhases] = useState<Array<{
    name: string
    description: string
    duration: string
    issues: Issue[]
  }>>([{
    name: "Phase 1",
    description: "Initial phase",
    duration: "1 week",
    issues: []
  }])

  // Currently editing issue
  const [editingPhaseIndex, setEditingPhaseIndex] = useState<number | null>(null)
  const [newIssue, setNewIssue] = useState({
    title: "",
    body: "",
    labels: [] as string[],
  })

  const addLabel = () => {
    if (!newLabel.name) return
    setLabels([...labels, newLabel])
    setNewLabel({ name: "", color: "0052CC", description: "" })
  }

  const removeLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index))
  }

  const addPhase = () => {
    setPhases([
      ...phases,
      {
        name: `Phase ${phases.length + 1}`,
        description: "",
        duration: "1 week",
        issues: []
      }
    ])
  }

  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index))
  }

  const updatePhase = (index: number, field: string, value: string) => {
    const updated = [...phases]
    updated[index] = { ...updated[index], [field]: value }
    setPhases(updated)
  }

  const addIssue = (phaseIndex: number) => {
    if (!newIssue.title) return

    const updated = [...phases]
    updated[phaseIndex].issues.push({
      ...newIssue,
      assignees: []
    })
    setPhases(updated)
    setNewIssue({ title: "", body: "", labels: [] })
    setEditingPhaseIndex(null)
  }

  const removeIssue = (phaseIndex: number, issueIndex: number) => {
    const updated = [...phases]
    updated[phaseIndex].issues = updated[phaseIndex].issues.filter((_, i) => i !== issueIndex)
    setPhases(updated)
  }

  const toggleIssueLabel = (labelName: string) => {
    if (newIssue.labels.includes(labelName)) {
      setNewIssue({
        ...newIssue,
        labels: newIssue.labels.filter(l => l !== labelName)
      })
    } else {
      setNewIssue({
        ...newIssue,
        labels: [...newIssue.labels, labelName]
      })
    }
  }

  const saveTemplate = () => {
    if (!templateName || phases.length === 0) {
      alert("Please provide a template name and at least one phase")
      return
    }

    const totalIssues = phases.reduce((sum, phase) => sum + phase.issues.length, 0)

    const template: Template = {
      id: `custom-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      category: templateCategory,
      icon: templateIcon,
      estimatedIssues: totalIssues,
      labels,
      phases
    }

    try {
      saveCustomTemplate(template)
      alert("Template saved successfully!")
      router.push("/")
    } catch (error) {
      alert("Failed to save template. Please try again.")
      console.error(error)
    }
  }

  const totalIssues = phases.reduce((sum, phase) => sum + phase.issues.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-purple-600 dark:text-purple-400 hover:underline mb-4 inline-block"
          >
            ← Back to Templates
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create Your Own Template
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Build a custom project board template with your own phases, issues, and labels
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
          {/* Template Info */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Template Info
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon
                </label>
                <EmojiPicker value={templateIcon} onChange={setTemplateIcon} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="My Project Template"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe what this template is for..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  placeholder="Custom"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* Labels */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Labels ({labels.length})
            </h2>

            <div className="space-y-3 mb-4">
              {labels.map((label, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `#${label.color}` }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{label.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{label.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLabel(index)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add New Label</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newLabel.name}
                  onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                  placeholder="Label name"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={newLabel.color}
                  onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value.replace('#', '') })}
                  placeholder="Color (hex)"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={newLabel.description}
                  onChange={(e) => setNewLabel({ ...newLabel, description: e.target.value })}
                  placeholder="Description"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={addLabel}
                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Label
              </button>
            </div>
          </section>

          {/* Phases & Issues */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Phases & Issues ({phases.length} phases, {totalIssues} issues)
            </h2>

            <div className="space-y-6">
              {phases.map((phase, phaseIndex) => (
                <div key={phaseIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-700/50">
                  <div className="space-y-4 mb-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {phase.name || `Phase ${phaseIndex + 1}`}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removePhase(phaseIndex)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm"
                      >
                        Remove Phase
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => updatePhase(phaseIndex, 'name', e.target.value)}
                        placeholder="Phase name"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={phase.duration}
                        onChange={(e) => updatePhase(phaseIndex, 'duration', e.target.value)}
                        placeholder="Duration (e.g., 2 weeks)"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={phase.description}
                        onChange={(e) => updatePhase(phaseIndex, 'description', e.target.value)}
                        placeholder="Description"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Issues ({phase.issues.length})
                    </h4>
                    {phase.issues.map((issue, issueIndex) => (
                      <div key={issueIndex} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{issue.title}</div>
                          <div className="flex gap-1 mt-1">
                            {issue.labels.map((labelName, i) => {
                              const labelInfo = labels.find(l => l.name === labelName)
                              return (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: labelInfo ? `#${labelInfo.color}20` : '#ccc',
                                    color: labelInfo ? `#${labelInfo.color}` : '#666'
                                  }}
                                >
                                  {labelName}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIssue(phaseIndex, issueIndex)}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Issue Form */}
                  {editingPhaseIndex === phaseIndex ? (
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-4 space-y-3">
                      <input
                        type="text"
                        value={newIssue.title}
                        onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                        placeholder="Issue title"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <textarea
                        value={newIssue.body}
                        onChange={(e) => setNewIssue({ ...newIssue, body: e.target.value })}
                        placeholder="Issue description (supports Markdown)"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Labels:</div>
                        <div className="flex flex-wrap gap-2">
                          {labels.map((label) => (
                            <button
                              key={label.name}
                              type="button"
                              onClick={() => toggleIssueLabel(label.name)}
                              className={`px-3 py-1 rounded text-sm transition-all ${
                                newIssue.labels.includes(label.name)
                                  ? 'ring-2 ring-purple-500'
                                  : ''
                              }`}
                              style={{
                                backgroundColor: `#${label.color}40`,
                                color: `#${label.color}`
                              }}
                            >
                              {label.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => addIssue(phaseIndex)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Add Issue
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPhaseIndex(null)}
                          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingPhaseIndex(phaseIndex)}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      + Add Issue to This Phase
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addPhase}
              className="mt-4 w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
            >
              + Add New Phase
            </button>
          </section>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/"
              className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 font-medium"
            >
              Cancel
            </Link>
            <button
              onClick={saveTemplate}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium shadow-lg"
            >
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
