import { Octokit } from 'octokit'
import simpleGit from 'simple-git'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { auth } from './auth'

/**
 * GitHub service for scanning repositories
 */

export interface GitHubRepo {
  owner: string
  repo: string
  branch?: string
}

export interface ScanResult {
  scanId: string
  repoUrl: string
  branch: string
  filesScanned: number
  violations: any[]
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): GitHubRepo | null {
  try {
    // Handle various GitHub URL formats:
    // https://github.com/owner/repo
    // https://github.com/owner/repo.git
    // git@github.com:owner/repo.git
    // github.com/owner/repo

    let cleanUrl = url.trim()

    // Remove git@ prefix
    cleanUrl = cleanUrl.replace(/^git@github\.com:/, 'https://github.com/')

    // Remove .git suffix
    cleanUrl = cleanUrl.replace(/\.git$/, '')

    // Parse URL
    const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`)

    const pathParts = urlObj.pathname.split('/').filter(Boolean)

    if (pathParts.length < 2) {
      return null
    }

    return {
      owner: pathParts[0],
      repo: pathParts[1],
      branch: 'main', // Default to main, will check actual default branch
    }
  } catch (error) {
    console.error('Error parsing GitHub URL:', error)
    return null
  }
}

/**
 * Get GitHub access token for authenticated user
 */
export async function getGitHubAccessToken(userId: string): Promise<string | null> {
  try {
    const session = await auth.api.getSession({
      headers: {
        'user-id': userId,
      },
    })

    if (!session) {
      return null
    }

    // Get GitHub account from database
    // The access_token is stored in the account table by Better Auth
    const account = await auth.api.listAccounts({
      headers: {
        'user-id': userId,
      },
    })

    const githubAccount = account.find((acc: any) => acc.providerId === 'github')

    if (!githubAccount) {
      return null
    }

    return githubAccount.accessToken || null
  } catch (error) {
    console.error('Error getting GitHub access token:', error)
    return null
  }
}

/**
 * Clone a GitHub repository to a temporary directory
 */
export async function cloneRepository(
  repoInfo: GitHubRepo,
  accessToken?: string
): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `klyntos-scan-${Date.now()}`)
  await fs.mkdir(tmpDir, { recursive: true })

  const git = simpleGit()

  // Build clone URL with authentication if token provided
  let cloneUrl: string
  if (accessToken) {
    cloneUrl = `https://${accessToken}@github.com/${repoInfo.owner}/${repoInfo.repo}.git`
  } else {
    // Public repo
    cloneUrl = `https://github.com/${repoInfo.owner}/${repoInfo.repo}.git`
  }

  try {
    await git.clone(cloneUrl, tmpDir, ['--depth', '1', '--single-branch', '--branch', repoInfo.branch || 'main'])
    return tmpDir
  } catch (error: any) {
    // If main branch doesn't exist, try master
    if (error.message?.includes('not found')) {
      try {
        await git.clone(cloneUrl, tmpDir, ['--depth', '1', '--single-branch', '--branch', 'master'])
        return tmpDir
      } catch (masterError) {
        // Clean up and throw
        await fs.rm(tmpDir, { recursive: true, force: true })
        throw new Error(`Failed to clone repository: Branch not found`)
      }
    }

    // Clean up and throw
    await fs.rm(tmpDir, { recursive: true, force: true })
    throw error
  }
}

/**
 * Get repository information using GitHub API
 */
export async function getRepositoryInfo(
  repoInfo: GitHubRepo,
  accessToken?: string
) {
  const octokit = new Octokit({
    auth: accessToken,
  })

  try {
    const { data: repo } = await octokit.rest.repos.get({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
    })

    return {
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      language: repo.language,
      size: repo.size,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      url: repo.html_url,
    }
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error('Repository not found or you do not have access')
    }
    throw error
  }
}

/**
 * Check if user has access to a repository
 */
export async function checkRepositoryAccess(
  repoInfo: GitHubRepo,
  accessToken: string
): Promise<boolean> {
  try {
    await getRepositoryInfo(repoInfo, accessToken)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get all source files from a directory (recursively)
 */
export async function getSourceFiles(dirPath: string): Promise<string[]> {
  const files: string[] = []

  const ignoredDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'venv',
    'env',
    '__pycache__',
    '.pytest_cache',
    'coverage',
    '.idea',
    '.vscode',
  ]

  const sourceExtensions = [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.py',
    '.go',
    '.rs',
    '.java',
    '.rb',
    '.php',
    '.sql',
    '.sh',
    '.bash',
    '.c',
    '.cpp',
    '.h',
    '.hpp',
    '.cs',
    '.swift',
    '.kt',
    '.scala',
  ]

  async function scan(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Skip ignored directories
        if (ignoredDirs.includes(entry.name) || entry.name.startsWith('.')) {
          continue
        }
        await scan(fullPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (sourceExtensions.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  }

  await scan(dirPath)
  return files
}

/**
 * Clean up temporary directory
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true })
  } catch (error) {
    console.error('Error cleaning up temp directory:', error)
  }
}

/**
 * List user's GitHub repositories
 */
export async function listUserRepositories(
  accessToken: string,
  page: number = 1,
  perPage: number = 30
) {
  const octokit = new Octokit({
    auth: accessToken,
  })

  try {
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: perPage,
      page,
      sort: 'updated',
      direction: 'desc',
    })

    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      isPrivate: repo.private,
      defaultBranch: repo.default_branch,
      language: repo.language,
      url: repo.html_url,
      updatedAt: repo.updated_at,
    }))
  } catch (error) {
    console.error('Error listing repositories:', error)
    throw error
  }
}

/**
 * Get repository branches
 */
export async function getRepoBranches(
  repoInfo: GitHubRepo,
  accessToken?: string
) {
  const octokit = new Octokit({
    auth: accessToken,
  })

  try {
    const { data: branches } = await octokit.rest.repos.listBranches({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      per_page: 100,
    })

    return branches.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
      commit: {
        sha: branch.commit.sha,
        url: branch.commit.url,
      },
    }))
  } catch (error) {
    console.error('Error getting branches:', error)
    throw error
  }
}
