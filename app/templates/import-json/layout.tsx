import type { Metadata } from "next"

// Requires a signed-in session (redirects to / otherwise), so a crawler
// visiting this URL directly never sees anything but a redirect.
export const metadata: Metadata = {
  title: "Import from JSON",
  robots: { index: false, follow: false },
}

export default function ImportJsonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
