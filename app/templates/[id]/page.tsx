import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getTemplateById } from "@/lib/templates"
import { TemplateDetails } from "@/components/template-details"
import { AuthButton } from "@/components/auth-button"

interface TemplatePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TemplatePageProps) {
  const { id } = await params
  const template = getTemplateById(id)

  if (!template) {
    return { title: "Template Not Found" }
  }

  return {
    title: `${template.name} - BoardKit`,
    description: template.description,
  }
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const { id } = await params
  const template = getTemplateById(id)

  if (!template) {
    notFound()
  }

  const session = await auth()

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
