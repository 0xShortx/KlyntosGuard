'use client'

/**
 * Scan History Dashboard
 * /scans
 *
 * Users can:
 * - View all their security scans
 * - Filter by status (passed/failed/all)
 * - See vulnerability counts
 * - Sort by date
 * - Paginate through results
 * - Click to view detailed scan results
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, AlertTriangle, CheckCircle2, XCircle, Clock, FileCode, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import Link from 'next/link'

interface Scan {
  id: string
  fileName: string
  language: string
  status: 'passed' | 'failed' | 'error'
  vulnerabilityCount: number
  createdAt: string
  duration: number | null
}

interface PaginationInfo {
  total: number
  limit: number
  offset: number
  has_more: boolean
}

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all')
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    offset: 0,
    has_more: false
  })

  useEffect(() => {
    fetchScans()
  }, [filter, pagination.offset])

  const fetchScans = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      })

      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/v1/scans?${params}`)
      const data = await response.json()

      if (response.ok) {
        setScans(data.scans || [])
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch scans:', data.error)
      }
    } catch (error) {
      console.error('Error fetching scans:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const nextPage = () => {
    if (pagination.has_more) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }))
    }
  }

  const prevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }))
    }
  }

  const getStatusBadge = (status: string, vulnerabilityCount: number) => {
    if (status === 'passed') {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Passed
        </Badge>
      )
    } else if (status === 'failed') {
      return (
        <Badge variant="danger" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Failed ({vulnerabilityCount})
        </Badge>
      )
    } else {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Error
        </Badge>
      )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="container max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Scan History
        </h1>
        <p className="text-gray-600 mt-2">
          View all your security scans and their results
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => {
            setFilter('all')
            setPagination(prev => ({ ...prev, offset: 0 }))
          }}
        >
          All Scans
        </Button>
        <Button
          variant={filter === 'passed' ? 'default' : 'outline'}
          onClick={() => {
            setFilter('passed')
            setPagination(prev => ({ ...prev, offset: 0 }))
          }}
          className="flex items-center gap-1"
        >
          <CheckCircle2 className="w-4 h-4" />
          Passed
        </Button>
        <Button
          variant={filter === 'failed' ? 'default' : 'outline'}
          onClick={() => {
            setFilter('failed')
            setPagination(prev => ({ ...prev, offset: 0 }))
          }}
          className="flex items-center gap-1"
        >
          <XCircle className="w-4 h-4" />
          Failed
        </Button>
      </div>

      {/* Scans List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Loading scans...
          </CardContent>
        </Card>
      ) : scans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
            <p className="text-gray-600 mb-4">
              Run your first security scan using the CLI
            </p>
            <code className="block p-3 bg-gray-100 rounded text-sm">
              kg scan your-file.py
            </code>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {scans.map((scan) => (
              <Card key={scan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileCode className="w-5 h-5 text-gray-500" />
                        <span className="font-semibold text-lg">{scan.fileName}</span>
                        {getStatusBadge(scan.status, scan.vulnerabilityCount)}
                        <Badge variant="outline" className="text-xs">
                          {scan.language}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 flex items-center gap-4 ml-8">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(scan.createdAt)}
                        </span>
                        <span>Duration: {formatDuration(scan.duration)}</span>
                        {scan.vulnerabilityCount > 0 && (
                          <span className="text-red-600 font-medium">
                            {scan.vulnerabilityCount} {scan.vulnerabilityCount === 1 ? 'vulnerability' : 'vulnerabilities'} found
                          </span>
                        )}
                      </div>
                    </div>

                    <Link href={`/scans/${scan.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} scans
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={pagination.offset === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!pagination.has_more}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Help Card */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How to Scan Your Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-900">
            <p><strong>1. Install the CLI:</strong></p>
            <code className="block p-2 bg-white rounded">pip install klyntos-guard</code>

            <p className="pt-2"><strong>2. Authenticate:</strong></p>
            <code className="block p-2 bg-white rounded">kg auth login --api-key YOUR_KEY</code>

            <p className="pt-2"><strong>3. Scan your code:</strong></p>
            <code className="block p-2 bg-white rounded">kg scan path/to/your/file.py</code>

            <p className="pt-2">
              Get your API key from{' '}
              <Link href="/settings/cli" className="text-blue-600 hover:underline font-semibold">
                Settings → CLI
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
