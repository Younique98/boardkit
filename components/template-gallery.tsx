"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TemplateCard } from "./template-card"
import { Template } from "@/types/template"
import { templates } from "@/lib/templates"
import { getCustomTemplates } from "@/lib/custom-templates"

export function TemplateGallery() {
  const [allTemplates, setAllTemplates] = useState<Template[]>(templates)

  const loadTemplates = () => {
    const customTemplates = getCustomTemplates()
    setAllTemplates([...templates, ...customTemplates])
  }

  useEffect(() => {
    loadTemplates()

    // Refresh templates when window gains focus (e.g., after editing and returning)
    const handleFocus = () => loadTemplates()
    window.addEventListener("focus", handleFocus)

    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const totalIssues = allTemplates.reduce((sum, t) => sum + t.estimatedIssues, 0)

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
          Choose Your Template
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {allTemplates.length} templates • {totalIssues}+ pre-written issues
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Your Own Template Card */}
        <Link
          href="/templates/create"
          className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-lg bg-white dark:bg-gray-800 p-6 flex flex-col items-center justify-center min-h-[200px]"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">➕</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Create Your Own
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
            Build a custom template with your own phases, issues, and labels
          </p>
        </Link>

        {/* Import from CSV Card */}
        <Link
          href="/templates/import"
          className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg bg-white dark:bg-gray-800 p-6 flex flex-col items-center justify-center min-h-[200px]"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Import from CSV
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
            Upload a spreadsheet to generate issues from your data
          </p>
        </Link>

        {/* Import from JSON Card */}
        <Link
          href="/templates/import-json"
          className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-lg bg-white dark:bg-gray-800 p-6 flex flex-col items-center justify-center min-h-[200px]"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Import from JSON
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
            Import shared templates from JSON files
          </p>
        </Link>

        {/* Template Cards */}
        {allTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  )
}
