'use client'

/**
 * Scan Detail Page
 * /scans/[id]
 *
 * Shows detailed scan results including:
 * - Scan metadata (file, language, date, duration)
 * - Status summary (passed/failed)
 * - Vulnerability breakdown by severity
 * - List of all vulnerabilities with details
 * - Code snippets and fix suggestions
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileCode,
  ArrowLeft,
  Download,
  AlertCircle,
  Lightbulb,
  Code
} from 'lucide-react'
import Link from 'next/link'

interface Vulnerability {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  message: string
  line: number | null
  codeSnippet: string | null
  suggestion: string | null
  cwe: string | null
}

interface Scan {
  id: string
  fileName: string
  language: string
  status: 'passed' | 'failed' | 'error'
  vulnerabilityCount: number
  createdAt: string
  duration: number | null
  code: string | null
  error: string | null
}

interface ScanDetail {
  scan: Scan
  vulnerabilities: Vulnerability[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
}

export default function ScanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const scanId = params.id as string

  const [scanDetail, setScanDetail] = useState<ScanDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchScanDetail()
  }, [scanId])

  const fetchScanDetail = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/scans/${scanId}`)
      const data = await response.json()

      if (response.ok) {
        setScanDetail(data)
      } else {
        setError(data.error || 'Failed to fetch scan details')
      }
    } catch (err) {
      setError('Error loading scan details')
      console.error('Error fetching scan details:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: { variant: 'danger' as const, label: 'Critical', icon: AlertCircle },
      high: { variant: 'danger' as const, label: 'High', icon: XCircle },
      medium: { variant: 'warning' as const, label: 'Medium', icon: AlertTriangle },
      low: { variant: 'secondary' as const, label: 'Low', icon: AlertTriangle },
      info: { variant: 'outline' as const, label: 'Info', icon: AlertCircle }
    }

    const config = variants[severity as keyof typeof variants] || variants.info
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-8">
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Loading scan details...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !scanDetail) {
    return (
      <div className="container max-w-6xl mx-auto p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error || 'Scan not found'}</p>
            <Link href="/scans">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Scans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { scan, vulnerabilities, summary } = scanDetail

  return (
    <div className="container max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/scans">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scans
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Scan Results
          </h1>
        </div>
      </div>

      {/* Scan Metadata */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileCode className="w-6 h-6" />
            {scan.fileName}
            {scan.status === 'passed' && (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Passed
              </Badge>
            )}
            {scan.status === 'failed' && (
              <Badge variant="danger" className="flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                Failed
              </Badge>
            )}
            {scan.status === 'error' && (
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Error
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(scan.createdAt)}
              </span>
              <span>Language: {scan.language}</span>
              <span>Duration: {formatDuration(scan.duration)}</span>
              <span>Scan ID: {scan.id}</span>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      {scan.status === 'failed' && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className={summary.critical > 0 ? 'border-red-500' : ''}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </CardContent>
          </Card>
          <Card className={summary.high > 0 ? 'border-orange-500' : ''}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.high}</div>
              <div className="text-sm text-gray-600">High</div>
            </CardContent>
          </Card>
          <Card className={summary.medium > 0 ? 'border-yellow-500' : ''}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.medium}</div>
              <div className="text-sm text-gray-600">Medium</div>
            </CardContent>
          </Card>
          <Card className={summary.low > 0 ? 'border-blue-500' : ''}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.low}</div>
              <div className="text-sm text-gray-600">Low</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{summary.info}</div>
              <div className="text-sm text-gray-600">Info</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Passed Scan */}
      {scan.status === 'passed' && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              No vulnerabilities found!
            </h3>
            <p className="text-green-700">
              Your code passed all security checks. Keep up the great work!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {scan.status === 'error' && scan.error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Scan Error</h3>
                <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-red-200">
                  {scan.error}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vulnerabilities List */}
      {vulnerabilities.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Vulnerabilities ({vulnerabilities.length})
          </h2>

          <div className="space-y-4">
            {vulnerabilities.map((vuln, index) => (
              <Card key={vuln.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-500 font-mono text-sm">#{index + 1}</span>
                        {getSeverityBadge(vuln.severity)}
                        <Badge variant="outline">{vuln.category}</Badge>
                        {vuln.line && (
                          <Badge variant="secondary" className="font-mono">
                            Line {vuln.line}
                          </Badge>
                        )}
                        {vuln.cwe && (
                          <a
                            href={`https://cwe.mitre.org/data/definitions/${vuln.cwe}.html`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            CWE-{vuln.cwe}
                          </a>
                        )}
                      </div>
                      <CardTitle className="text-lg">{vuln.message}</CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Code Snippet */}
                  {vuln.codeSnippet && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-700">Code:</span>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm font-mono border-l-4 border-red-500">
                        {vuln.codeSnippet}
                      </pre>
                    </div>
                  )}

                  {/* Suggestion */}
                  {vuln.suggestion && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-semibold text-blue-900 mb-1">
                            Suggested Fix:
                          </div>
                          <p className="text-sm text-blue-800">{vuln.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <Link href="/scans">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Scans
          </Button>
        </Link>
        {/* Future: Export functionality */}
        {/* <Button variant="outline" disabled>
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button> */}
      </div>
    </div>
  )
}
