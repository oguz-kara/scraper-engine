import { gql } from '@apollo/client'

export const CREATE_JOB = gql`
  mutation createJob($input: CreateJobInput!) {
    createJob(input: $input) {
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

export const START_JOB = gql`
  mutation startJob($startJobId: ID!) {
    startJob(id: $startJobId) {
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

export const PAUSE_JOB = gql`
  mutation pauseJob($pauseJobId: ID!) {
    pauseJob(id: $pauseJobId) {
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

export const RESUME_JOB = gql`
  mutation resumeJob($resumeJobId: ID!) {
    resumeJob(id: $resumeJobId) {
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

export const RETRY_JOB = gql`
  mutation retryJob($retryJobId: ID!) {
    retryJob(id: $retryJobId) {
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

export const CANCEL_JOB_BY_ID = gql`
  mutation cancelJob($cancelJobId: ID!) {
    cancelJob(id: $cancelJobId) {
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
