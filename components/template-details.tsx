"use client"

import { useState } from "react"
import { Template } from "@/types/template"
import Link from "next/link"
import { RepoSelector } from "./repo-selector"

interface TemplateDetailsProps {
  template: Template
}

export function TemplateDetails({ template }: TemplateDetailsProps) {
  const [showRepoSelector, setShowRepoSelector] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="text-3xl">📋</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  BoardKit
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">← Back to templates</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Template Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-6">
            <div className="text-7xl">{template.icon}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {template.name}
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300">
                    {template.description}
                  </p>
                </div>
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {template.category}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {template.estimatedIssues} issues
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {template.labels.length} labels
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {template.phases.length} phases
                </span>
              </div>

              <button
                onClick={() => setShowRepoSelector(true)}
                className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
              >
                Generate This Board
              </button>
            </div>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Project Phases
          </h2>

          {template.phases.map((phase, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
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
                  <span className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    {phase.duration}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {phase.issues.length} issues in this phase:
                </p>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {phase.issues.slice(0, 6).map((issue, issueIndex) => (
                    <li
                      key={issueIndex}
                      className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2"
                    >
                      <span className="text-blue-500 mt-1">→</span>
                      <span className="flex-1">{issue.title}</span>
                    </li>
                  ))}
                  {phase.issues.length > 6 && (
                    <li className="text-sm text-gray-500 dark:text-gray-400 italic">
                      + {phase.issues.length - 6} more issues...
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Labels Preview */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Labels
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
      </main>

      {/* Repository Selector Modal */}
      {showRepoSelector && (
        <RepoSelector
          template={template}
          onClose={() => setShowRepoSelector(false)}
        />
      )}
    </div>
  )
}
