import type { Metadata } from "next"

// Final review step of the CSV import flow - depends entirely on state
// handed off from the previous two steps, so it's excluded from search
// results the same way.
export const metadata: Metadata = {
  title: "Preview Import",
  robots: { index: false, follow: false },
}

export default function ImportPreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
