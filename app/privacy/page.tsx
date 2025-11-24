import Link from "next/link"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Last updated: November 23, 2025
        </p>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Introduction
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              BoardKit (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Information We Collect
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              BoardKit collects minimal information necessary to provide our service:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>
                <strong>GitHub Account Information:</strong> When you authenticate with GitHub, we receive your GitHub username, email address, and profile picture. This information is used solely for authentication purposes.
              </li>
              <li>
                <strong>GitHub Access Token:</strong> We temporarily store your GitHub OAuth access token during your session to enable board generation in your repositories. This token is encrypted and stored securely.
              </li>
              <li>
                <strong>Usage Data:</strong> We may collect anonymous usage statistics to improve our service, such as which templates are most popular.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              How We Use Your Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>To authenticate your identity via GitHub OAuth</li>
              <li>To generate project boards in your GitHub repositories</li>
              <li>To provide, maintain, and improve our services</li>
              <li>To communicate with you about service updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Data Storage and Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>All data transmission is encrypted using SSL/TLS</li>
              <li>Access tokens are encrypted at rest</li>
              <li>We do not store your GitHub password</li>
              <li>Session data is cleared when you log out</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Data Sharing and Third Parties
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We do not sell, trade, or rent your personal information to third parties. We only share data with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>
                <strong>GitHub:</strong> We interact with GitHub&apos;s API using your OAuth token to create issues and labels in your repositories.
              </li>
              <li>
                <strong>Vercel:</strong> Our hosting provider, which processes requests to our application. They comply with GDPR and industry security standards.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Your Rights and Choices
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              You have the following rights regarding your data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>
                <strong>Access:</strong> You can request a copy of your data at any time
              </li>
              <li>
                <strong>Deletion:</strong> You can request deletion of your data by signing out and revoking OAuth access at GitHub
              </li>
              <li>
                <strong>Revoke Access:</strong> You can revoke BoardKit&apos;s access to your GitHub account at any time through GitHub Settings → Applications
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Cookies and Tracking
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              BoardKit uses essential cookies for authentication and session management. We do not use tracking cookies or third-party analytics that identify individual users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Children&apos;s Privacy
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              BoardKit is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <ul className="list-none text-gray-700 dark:text-gray-300 space-y-1">
              <li>Email: [Your email address]</li>
              <li>GitHub: <Link href="https://github.com/Younique98/boardkit" className="text-blue-600 hover:underline">github.com/Younique98/boardkit</Link></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              GDPR Compliance
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              For users in the European Economic Area (EEA), we comply with the General Data Protection Regulation (GDPR). You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to BoardKit
          </Link>
        </div>
      </div>
    </div>
  )
}
