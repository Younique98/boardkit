import type { Metadata } from "next"
import { getTemplateById } from "@/lib/templates"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const template = getTemplateById(id)

  if (!template) {
    return {
      title: "Template Not Found",
      robots: { index: false, follow: false },
    }
  }

  const trimmedDescription = template.description.trim()
  const separator = /[.!?]$/.test(trimmedDescription) ? "" : "."
  const description = `${trimmedDescription}${separator} Generate a ready-to-use GitHub project board with ${template.estimatedIssues}+ pre-written issues and ${template.labels.length} labels in one click.`

  return {
    title: template.name,
    description,
    alternates: {
      canonical: `/templates/${template.id}`,
    },
    openGraph: {
      title: `${template.name} | BoardKit`,
      description,
    },
  }
}

export default function TemplateDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
