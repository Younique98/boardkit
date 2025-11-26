"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getTemplateById } from "@/lib/templates"
import { TemplateForm } from "@/components/template-form"
import { Template } from "@/types/template"

interface EditTemplatePageProps {
  params: Promise<{ id: string }>
}

export default function EditTemplatePage({ params }: EditTemplatePageProps) {
  const router = useRouter()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => {
      const foundTemplate = getTemplateById(id)

      // Only allow editing custom templates
      if (!foundTemplate || !foundTemplate.id.startsWith("custom-")) {
        router.push("/")
        return
      }

      setTemplate(foundTemplate)
      setLoading(false)
    })
  }, [params, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Template Not Found
          </h1>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return <TemplateForm initialTemplate={template} mode="edit" />
}
