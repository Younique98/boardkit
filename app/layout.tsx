import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

const SITE_URL = "https://boardkit.app";
const DESCRIPTION =
  "BoardKit generates structured GitHub project boards from pre-built templates - 20+ templates and 900+ pre-written issues, cutting hours of manual setup down to seconds.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BoardKit - GitHub Project Board Generator",
    template: "%s | BoardKit",
  },
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BoardKit",
  },
  openGraph: {
    type: "website",
    siteName: "BoardKit",
    title: "BoardKit - GitHub Project Board Generator",
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "BoardKit - GitHub Project Board Generator",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
