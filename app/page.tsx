import { auth } from "@/lib/auth"
import { templates } from "@/lib/templates"
import { TemplateCard } from "@/components/template-card"
import { AuthButton } from "@/components/auth-button"
import Image from "next/image"

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📋</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  BoardKit
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">GitHub Project Generator</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {session?.user && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="hidden md:inline">{session.user.name}</span>
                </div>
              )}
              <AuthButton isSignedIn={!!session} variant="secondary" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <h2 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Generate GitHub Boards
            <br />
            <span className="text-4xl sm:text-5xl">in Seconds</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose from pre-built project templates and create comprehensive GitHub project boards instantly.
            No more hours of manual setup.
          </p>

          {!session && (
            <div className="flex justify-center pt-4">
              <AuthButton isSignedIn={false} variant="primary" />
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Generate complete project boards with 20-70+ issues in under a minute
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Battle-Tested</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Templates created from real-world projects and best practices
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Mobile Ready</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Progressive Web App - install and use on any device
            </p>
          </div>
        </div>

        {/* Template Gallery */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              Choose Your Template
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {templates.length} templates • {templates.reduce((sum, t) => sum + t.estimatedIssues, 0)}+ pre-written issues
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        {!session && (
          <div className="mt-16 text-center p-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-blue-100 mb-6 text-lg">
              Connect your GitHub account and start generating project boards
            </p>
            <AuthButton isSignedIn={false} variant="secondary" />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-400">
          <p>Built with Next.js 15 • Made for developers, by developers</p>
          <p className="text-sm mt-2">© 2025 BoardKit. Open source and free to use.</p>
        </div>
      </footer>
    </div>
  )
}
