'use client'

/**
 * Settings Page: API Keys (Alias for /settings/cli)
 * /settings/api-keys
 *
 * This is an alias for the CLI settings page to maintain consistency
 * with the documentation that references /settings/api-keys
 */

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function ApiKeysPage() {
  useEffect(() => {
    redirect('/settings/cli')
  }, [])

  return null
}
