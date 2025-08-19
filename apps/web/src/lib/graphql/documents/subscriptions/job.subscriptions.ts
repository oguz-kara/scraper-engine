import { gql } from '@apollo/client'

export const JOB_STATUS_CHANGED = gql`
  subscription jobStatusChanged {
    jobStatusChanged {
      completedAt
      configuration
      createdAt
      currentInput
      duration
      errorCode
      errorMessage
      failedAt
      id
      input
      itemsPerSecond
      itemsScraped
      lastRetryAt
      pausedAt
      processedInput
      progressPercentage
      provider
      remainingInput
      retryCount
      startedAt
      status
    }
  }
`

export const JOB_PROGRESS_UPDATED = gql`
  subscription jobProgressUpdated {
    jobProgressUpdated {
      jobId
      percentage
      itemsScraped
      itemsPerSecond
      timestamp
    }
  }
`
