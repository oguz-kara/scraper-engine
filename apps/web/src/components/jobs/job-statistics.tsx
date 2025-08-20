'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { AlertCircle, TrendingUp, Package, Copy, CheckCircle, XCircle } from 'lucide-react'

interface JobStatisticsProps {
  job: {
    id: string
    itemsScraped: number
    scrapedItemStats?: {
      totalItems: number
      uniqueItems: number
      duplicatesSkipped: number
      byProvider: Array<{
        provider: string
        totalItems: number
        successfulTransformations: number
        failedTransformations: number
      }>
    }
    processorStats?: {
      totalItems: number
      duplicatesSkipped: number
      itemsStored: number
      transformationErrors: number
      successRate: number
      duplicateRate: number
    }
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function JobStatistics({ job }: JobStatisticsProps) {
  const scrapedStats = job.scrapedItemStats
  const processorStats = job.processorStats

  if (!scrapedStats && !processorStats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No statistics available yet. Start scraping to see data.
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare category data from provider stats
  const categoryData =
    scrapedStats?.byProvider.map(provider => ({
      name: provider.provider,
      value: provider.totalItems,
      successful: provider.successfulTransformations,
      failed: provider.failedTransformations,
    })) || []

  // Processing efficiency data
  const processingData = processorStats
    ? [
        { name: 'Items Stored', value: processorStats.itemsStored, color: '#00C49F' },
        { name: 'Duplicates Skipped', value: processorStats.duplicatesSkipped, color: '#FFBB28' },
        { name: 'Transformation Errors', value: processorStats.transformationErrors, color: '#FF8042' },
      ]
    : []

  const successRate = processorStats?.successRate || 0
  const duplicateRate = processorStats?.duplicateRate || 0

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scrapedStats?.totalItems || processorStats?.totalItems || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicates</CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scrapedStats?.duplicatesSkipped || processorStats?.duplicatesSkipped || 0}
            </div>
            <p className="text-xs text-muted-foreground">{duplicateRate.toFixed(1)}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processorStats?.transformationErrors || 0}</div>
            <p className="text-xs text-muted-foreground">Failed to process</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Performance */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Total Items" />
                <Bar dataKey="successful" fill="#00C49F" name="Successful" />
                <Bar dataKey="failed" fill="#FF8042" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Processing Breakdown */}
      {processingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent || 0 * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {processingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Provider Details */}
      {scrapedStats?.byProvider && scrapedStats.byProvider.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Provider Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scrapedStats.byProvider.map(provider => {
                const successRate =
                  provider.totalItems > 0
                    ? ((provider.successfulTransformations / provider.totalItems) * 100).toFixed(1)
                    : 0

                return (
                  <div key={provider.provider} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{provider.provider}</Badge>
                      <div>
                        <p className="font-medium">{provider.totalItems} total items</p>
                        <p className="text-sm text-muted-foreground">{successRate}% success rate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{provider.successfulTransformations}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">{provider.failedTransformations}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
