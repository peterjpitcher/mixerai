'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MetadataResult } from '@/types/metadata'
import { Download } from 'lucide-react'

interface BulkMetadataResultsProps {
  results: MetadataResult[]
}

export default function BulkMetadataResults({ results }: BulkMetadataResultsProps) {
  const handleDownloadCSV = () => {
    // Create CSV content
    const headers = ['URL', 'Page Title', 'Meta Description', 'OG Title', 'OG Description', 'Language', 'Status']
    const rows = results.map(result => [
      result.url,
      result.pageTitle,
      result.metaDescription,
      result.ogTitle,
      result.ogDescription,
      result.language,
      result.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `metadata-results-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Results ({results.length} URLs)</h2>
          <Button onClick={handleDownloadCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Page Title</TableHead>
                <TableHead>Meta Description</TableHead>
                <TableHead>OG Title</TableHead>
                <TableHead>OG Description</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="max-w-[200px] truncate">{result.url}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{result.pageTitle}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{result.metaDescription}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{result.ogTitle}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{result.ogDescription}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 