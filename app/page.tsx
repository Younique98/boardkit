export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            BoardKit
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Generate structured GitHub project boards in seconds
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">Pre-built Templates</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choose from curated project templates for startups, MVPs, and more
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with GitHub OAuth and generate boards instantly
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-lg font-semibold mb-2">Mobile Ready</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Progressive Web App - install on any device
            </p>
          </div>
        </div>

        <div className="text-center">
          <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-semibold transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </main>
  );
}
