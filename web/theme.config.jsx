import { Shield } from 'lucide-react'

export default {
  logo: (
    <div className="flex items-center space-x-2">
      <Shield className="w-6 h-6" />
      <span className="font-bold">KlyntosGuard Docs</span>
    </div>
  ),
  project: {
    link: 'https://github.com/klyntos/guard',
  },
  docsRepositoryBase: 'https://github.com/klyntos/guard',
  footer: {
    text: (
      <span>
        {new Date().getFullYear()} ©{' '}
        <a href="https://klyntos.com" target="_blank" rel="noopener">
          Klyntos
        </a>
        . All rights reserved.
      </span>
    ),
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – KlyntosGuard',
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="KlyntosGuard Documentation" />
      <meta property="og:description" content="AI-powered code security for developers" />
    </>
  ),
  primaryHue: 211, // Blue color
  darkMode: true,
  nextThemes: {
    defaultTheme: 'system',
  },
}
