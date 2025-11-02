'use client'

import { useState, useEffect } from 'react'
import { Search, GitBranch, Lock, Globe, Star, GitFork } from 'lucide-react'

interface Repository {
  id: number
  name: string
  fullName: string
  description: string | null
  isPrivate: boolean
  defaultBranch: string
  language: string | null
  url: string
  updatedAt: string
}

interface Branch {
  name: string
  protected: boolean
}

interface RepoSelectorProps {
  onSelectRepo: (fullName: string, branch: string) => void
  accessToken?: string
}

export function RepoSelector({ onSelectRepo, accessToken }: RepoSelectorProps) {
  const [repos, setRepos] = useState<Repository[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)

  useEffect(() => {
    if (accessToken) {
      loadRepositories()
    }
  }, [accessToken])

  const loadRepositories = async () => {
    if (!accessToken) return

    setLoading(true)
    try {
      const response = await fetch('/api/v1/github/repos', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRepos(data.repositories)
      }
    } catch (error) {
      console.error('Error loading repositories:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBranches = async (fullName: string) => {
    setLoadingBranches(true)
    try {
      const [owner, repo] = fullName.split('/')
      const response = await fetch(`/api/v1/github/repos/${owner}/${repo}/branches`)

      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches)

        // Auto-select default branch
        const defaultBranch = data.branches.find((b: Branch) =>
          b.name === 'main' || b.name === 'master'
        )
        if (defaultBranch) {
          setSelectedBranch(defaultBranch.name)
        }
      }
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setLoadingBranches(false)
    }
  }

  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo.fullName)
    setSelectedBranch(repo.defaultBranch)
    loadBranches(repo.fullName)
  }

  const handleConfirm = () => {
    if (selectedRepo && selectedBranch) {
      onSelectRepo(selectedRepo, selectedBranch)
    }
  }

  const filteredRepos = repos.filter((repo) =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!accessToken) {
    return (
      <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-8 text-center">
        <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" strokeWidth={3} />
        <h3 className="text-xl font-black mb-2">Connect GitHub Account</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 font-bold">
          Connect your GitHub account to scan your repositories
        </p>
        <a
          href="/api/auth/sign-in/social/github"
          className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white font-black uppercase hover:bg-blue-600 hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white transition-colors"
        >
          Connect GitHub
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={3} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search repositories..."
          className="w-full pl-12 pr-4 py-4 border-4 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-bold text-lg focus:outline-none focus:border-blue-600"
        />
      </div>

      {/* Repository List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-black border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-bold text-gray-600 dark:text-gray-400">Loading repositories...</p>
        </div>
      ) : (
        <div className="border-4 border-black dark:border-white bg-white dark:bg-black max-h-96 overflow-y-auto">
          {filteredRepos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 font-bold">No repositories found</p>
            </div>
          ) : (
            filteredRepos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => handleRepoSelect(repo)}
                className={`w-full p-4 text-left border-b-4 border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                  selectedRepo === repo.fullName ? 'bg-blue-50 dark:bg-blue-950' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {repo.isPrivate ? (
                        <Lock className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={3} />
                      ) : (
                        <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={3} />
                      )}
                      <h3 className="font-black text-lg">{repo.fullName}</h3>
                    </div>
                    {repo.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-bold mb-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-500">
                      {repo.language && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" strokeWidth={3} />
                        {repo.defaultBranch}
                      </span>
                    </div>
                  </div>
                  {selectedRepo === repo.fullName && (
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 border-2 border-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Branch Selector */}
      {selectedRepo && (
        <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
          <label className="block text-sm font-black uppercase tracking-wide mb-2">
            Select Branch
          </label>
          {loadingBranches ? (
            <div className="py-4 text-center">
              <div className="w-6 h-6 border-4 border-black border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-3 border-4 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-bold text-lg focus:outline-none focus:border-blue-600"
            >
              {branches.map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name} {branch.protected && '🔒'}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Confirm Button */}
      {selectedRepo && selectedBranch && (
        <button
          onClick={handleConfirm}
          className="w-full px-8 py-5 bg-blue-600 border-4 border-blue-600 text-white font-black text-lg uppercase tracking-wide hover:bg-black hover:border-black dark:hover:bg-white dark:hover:text-black transition-colors"
        >
          Scan {selectedRepo} ({selectedBranch})
        </button>
      )}
    </div>
  )
}
