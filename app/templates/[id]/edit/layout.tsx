import type { Metadata } from "next"

// The editor only ever operates on a template already saved in the current
// visitor's browser (see lib/custom-templates.ts) - there's no content here
// for a crawler to usefully index, so this route is excluded from search
// results even though it isn't excluded from crawling.
export const metadata: Metadata = {
  title: "Edit Template",
  robots: { index: false, follow: false },
}

export default function EditTemplateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
