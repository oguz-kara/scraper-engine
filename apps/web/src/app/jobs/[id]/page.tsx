'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  useGetJobWithItemsQuery,
  useProcessorStatsUpdatedSubscription,
  useItemProcessedSubscription,
} from '@/graphql/generated/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { JobStatusBadge } from '@/components/jobs/job-status-badge'
import { JobActions } from '@/components/jobs/job-actions'
import { JobProgress } from '@/components/jobs/job-progress'
import { ScrapedItemsList } from '@/components/jobs/scraped-items-list'
import { CheckpointStatus } from '@/components/jobs/checkpoint-status'
import { JobStatistics } from '@/components/jobs/job-statistics'
import { JobOverview } from '@/components/jobs/job-overview'
import { JobConfiguration } from '@/components/jobs/job-configuration'
import { InfoIcon, Package, Save, BarChart3, AlertCircle } from 'lucide-react'

function ErrorAlert({ error }: { error: any }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>Error loading job: {error.message}</AlertDescription>
    </Alert>
  )
}

function NotFoundAlert() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>Job not found or you don't have permission to view it.</AlertDescription>
    </Alert>
  )
}

function JobDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default function JobDetailPage() {
  const params = useParams()
  const jobId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')

  const { data, loading, error, refetch } = useGetJobWithItemsQuery({
    variables: { id: jobId },
    pollInterval: 2000, // Poll for updates
  })

  // Subscribe to processor stats updates
  useProcessorStatsUpdatedSubscription({
    variables: { jobId },
    onData: ({ data }) => {
      if (data.data?.processorStatsUpdated) {
        refetch()
      }
    },
  })

  // Subscribe to new items being processed
  useItemProcessedSubscription({
    variables: { jobId },
    onData: ({ data }) => {
      if (data.data?.itemProcessed) {
        refetch()
      }
    },
  })

  // Checkpoint subscriptions are not supported by the backend; relying on other subscriptions and polling

  if (loading && !data) return <JobDetailSkeleton />
  if (error) return <ErrorAlert error={error} />
  if (!data?.job) return <NotFoundAlert />

  const job = data.job
  const scrapedItemStats = data.getScrapedItemStats
  const processorStats = data.getProcessorStats

  const isRunning = job.status === 'RUNNING'
  const hasItems = scrapedItemStats?.totalItems > 0 || processorStats?.itemsStored > 0
  const itemCount = scrapedItemStats?.totalItems || processorStats?.itemsStored || 0

  // Combine stats for components
  const enhancedJob = {
    ...job,
    scrapedItemStats,
    processorStats,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Job Details</h1>
          <p className="text-muted-foreground mt-1">
            ID: <code className="text-sm bg-muted px-2 py-1 rounded">{job.id}</code>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <JobStatusBadge status={job.status} />
          <JobActions job={job} onActionComplete={refetch} />
        </div>
      </div>

      {/* Progress Section */}
      {(isRunning || hasItems) && <JobProgress job={job} showDetails />}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Scraped</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemCount}</div>
            {scrapedItemStats?.duplicatesSkipped > 0 && (
              <p className="text-xs text-muted-foreground">{scrapedItemStats.duplicatesSkipped} duplicates skipped</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processorStats?.successRate?.toFixed(1) || '0.0'}%</div>
            <p className="text-xs text-muted-foreground">Processing success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scrapedItemStats?.byProvider?.length || 1}</div>
            <p className="text-xs text-muted-foreground">Data sources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provider</CardTitle>
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-lg">
              {job.provider}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items" disabled={!hasItems}>
            Items ({itemCount})
          </TabsTrigger>
          <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
          <TabsTrigger value="statistics" disabled={!hasItems}>
            Statistics
          </TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <JobOverview job={job} />
        </TabsContent>

        <TabsContent value="items">
          <ScrapedItemsList jobId={job.id} />
        </TabsContent>

        <TabsContent value="checkpoints">
          <CheckpointStatus job={job} />
        </TabsContent>

        <TabsContent value="statistics">
          <JobStatistics job={enhancedJob} />
        </TabsContent>

        <TabsContent value="configuration">
          <JobConfiguration job={job} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
