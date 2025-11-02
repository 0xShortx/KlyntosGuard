import Link from 'next/link'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-black">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-black">
            KLYNTOS GUARD
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <div className="sticky top-8 space-y-2">
            <Link
              href="/docs"
              className="block px-4 py-2 hover:bg-black hover:text-white transition-colors border border-black font-bold"
            >
              Introduction
            </Link>
            <Link
              href="/docs/getting-started"
              className="block px-4 py-2 hover:bg-black hover:text-white transition-colors border border-black font-bold"
            >
              Getting Started
            </Link>
            <Link
              href="/docs/pro-features"
              className="block px-4 py-2 hover:bg-black hover:text-white transition-colors border border-black font-bold"
            >
              Pro Features & API
            </Link>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 prose prose-lg max-w-none">
          {children}
        </main>
      </div>
    </div>
  )
}
