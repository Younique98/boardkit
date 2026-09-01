import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create a Custom Template",
  description:
    "Build your own GitHub project board template from scratch: define phases, write issues, and set up labels tailored to your workflow.",
  alternates: {
    canonical: "/templates/create",
  },
}

export default function CreateTemplateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
