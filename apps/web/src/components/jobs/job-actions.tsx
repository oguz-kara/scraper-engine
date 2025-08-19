'use client'

import {
  usePauseJobMutation,
  useResumeJobMutation,
  useCancelJobMutation,
  useRetryJobMutation,
} from '@/graphql/generated/hooks'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { MoreHorizontal, Pause, Play, Square, RotateCcw, Loader2 } from 'lucide-react'
import { JobStatus } from '@/graphql/generated/sdk'
import { useState } from 'react'

interface JobActionsProps {
  job: {
    id: string
    status: JobStatus
  }
}

export function JobActions({ job }: JobActionsProps) {
  const { toast } = useToast()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  // ALWAYS use generated mutation hooks
  const [pauseJob] = usePauseJobMutation({
    refetchQueries: ['GetJob', 'GetJobs'],
  })

  const [resumeJob] = useResumeJobMutation({
    refetchQueries: ['GetJob', 'GetJobs'],
  })

  const [cancelJob] = useCancelJobMutation({
    refetchQueries: ['GetJob', 'GetJobs'],
  })

  const [retryJob] = useRetryJobMutation({
    refetchQueries: ['GetJob', 'GetJobs'],
  })

  const handlePause = async () => {
    try {
      setLoadingAction('pause')
      await pauseJob({ variables: { pauseJobId: job.id } })
      toast({
        title: 'Job paused',
        description: 'The job has been paused successfully.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleResume = async () => {
    try {
      setLoadingAction('resume')
      await resumeJob({ variables: { resumeJobId: job.id } })
      toast({
        title: 'Job resumed',
        description: 'The job has been resumed successfully.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleCancel = async () => {
    try {
      setLoadingAction('cancel')
      await cancelJob({ variables: { cancelJobId: job.id } })
      toast({
        title: 'Job cancelled',
        description: 'The job has been cancelled successfully.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRetry = async () => {
    try {
      setLoadingAction('retry')
      await retryJob({ variables: { retryJobId: job.id } })
      toast({
        title: 'Job retried',
        description: 'The job has been queued for retry.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const getAvailableActions = () => {
    const actions: Array<{
      key: string
      label: string
      icon: React.ElementType
      onClick: () => void
      variant?: 'default' | 'destructive'
    }> = []

    switch (job.status) {
      case JobStatus.Running:
        actions.push({
          key: 'pause',
          label: 'Pause Job',
          icon: Pause,
          onClick: handlePause,
        })
        actions.push({
          key: 'cancel',
          label: 'Cancel Job',
          icon: Square,
          onClick: handleCancel,
          variant: 'destructive',
        })
        break

      case JobStatus.Paused:
        actions.push({
          key: 'resume',
          label: 'Resume Job',
          icon: Play,
          onClick: handleResume,
        })
        actions.push({
          key: 'cancel',
          label: 'Cancel Job',
          icon: Square,
          onClick: handleCancel,
          variant: 'destructive',
        })
        break

      case JobStatus.Failed:
      case JobStatus.Cancelled:
        actions.push({
          key: 'retry',
          label: 'Retry Job',
          icon: RotateCcw,
          onClick: handleRetry,
        })
        break

      case JobStatus.Pending:
        actions.push({
          key: 'cancel',
          label: 'Cancel Job',
          icon: Square,
          onClick: handleCancel,
          variant: 'destructive',
        })
        break
    }

    return actions
  }

  const availableActions = getAvailableActions()

  console.log({ availableActions })

  if (availableActions.length === 0) {
    return null
  }

  if (availableActions.length === 1) {
    const action = availableActions[0]
    const Icon = action.icon
    return (
      <Button
        variant={action.variant === 'destructive' ? 'destructive' : 'default'}
        onClick={action.onClick}
        disabled={loadingAction === action.key}
      >
        {loadingAction === action.key ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icon className="mr-2 h-4 w-4" />
        )}
        {action.label}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Job actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableActions.map(action => {
          const Icon = action.icon
          return (
            <DropdownMenuItem
              key={action.key}
              onClick={action.onClick}
              className={action.variant === 'destructive' ? 'text-destructive' : ''}
              disabled={loadingAction === action.key}
            >
              {loadingAction === action.key ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icon className="mr-2 h-4 w-4" />
              )}
              {action.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
