import type { Metadata } from "next"

// Requires a signed-in session (redirects to / otherwise), so a crawler
// visiting this URL directly never sees anything but a redirect.
export const metadata: Metadata = {
  title: "Import from CSV",
  description:
    "Upload a CSV spreadsheet and BoardKit converts each row into a GitHub issue, grouped into phases, ready to generate as a project board.",
  robots: { index: false, follow: false },
}

export default function ImportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
