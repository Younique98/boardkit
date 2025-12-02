"use client"

import { signIn, signOut } from "next-auth/react"
import { useState, useEffect } from "react"

interface AuthButtonProps {
  isSignedIn: boolean
  variant?: "primary" | "secondary"
}

export function AuthButton({ isSignedIn, variant = "primary" }: AuthButtonProps) {
  const [isPWA, setIsPWA] = useState(false)
  const [showPWAWarning, setShowPWAWarning] = useState(false)

  useEffect(() => {
    // Detect if running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    // iOS Safari has a standalone property on navigator
    const isIOSPWA = 'standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true
    setIsPWA(isStandalone || isIOSPWA)
  }, [])

  const baseClasses = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
  const primaryClasses = "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
  const secondaryClasses = "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"

  const handleSignIn = () => {
    if (isPWA) {
      setShowPWAWarning(true)
    } else {
      signIn("github")
    }
  }

  if (isSignedIn) {
    return (
      <button
        onClick={() => signOut()}
        className={`${baseClasses} ${secondaryClasses}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out
      </button>
    )
  }

  return (
    <>
      <button
        onClick={handleSignIn}
        className={`${baseClasses} ${variant === "primary" ? primaryClasses : secondaryClasses}`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
        Connect with GitHub
      </button>

      {/* PWA Auth Warning Modal */}
      {showPWAWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPWAWarning(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <div className="text-5xl">🔐</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Open in Safari to Sign In
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                iOS PWAs have security restrictions for OAuth. Please sign in using Safari first, then return to the app.
              </p>
              <div className="space-y-3 pt-2">
                <a
                  href={window.location.origin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Open in Safari →
                </a>
                <button
                  onClick={() => setShowPWAWarning(false)}
                  className="block w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
