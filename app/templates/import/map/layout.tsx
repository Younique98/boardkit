import type { Metadata } from "next"

// Mid-flow step: only renders anything meaningful when it has CSV data
// handed off via sessionStorage from /templates/import. Nothing here for a
// crawler to index.
export const metadata: Metadata = {
  title: "Map CSV Columns",
  robots: { index: false, follow: false },
}

export default function ImportMapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
