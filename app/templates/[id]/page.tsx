"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { getTemplateById } from "@/lib/templates"
import { TemplateDetails } from "@/components/template-details"
import { AuthButton } from "@/components/auth-button"
import { Template } from "@/types/template"

interface TemplatePageProps {
  params: Promise<{ id: string }>
}

export default function TemplatePage({ params }: TemplatePageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTemplate = async () => {
    const { id } = await params
    const foundTemplate = getTemplateById(id)
    setTemplate(foundTemplate || null)
    setLoading(false)
  }

  useEffect(() => {
    loadTemplate()

    // Refresh template when window gains focus (e.g., after editing and returning)
    const handleFocus = () => loadTemplate()
    window.addEventListener("focus", handleFocus)

    return () => window.removeEventListener("focus", handleFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center space-y-6">
          <div className="text-6xl">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Template Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The template you&apos;re looking for doesn&apos;t exist or may have been deleted.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Templates
          </button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center space-y-6">
          <div className="text-6xl">{template.icon}</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sign in to Use This Template
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your GitHub account to generate {template.name} project board
          </p>
          <AuthButton isSignedIn={false} variant="primary" />
        </div>
      </div>
    )
  }

  return <TemplateDetails template={template} />
}
