import { gql } from '@apollo/client'

export const GET_JOBS = gql`
  query jobs {
    jobs {
      edges {
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
      hasNextPage
      hasPreviousPage
      totalCount
    }
  }
`

export const GET_JOB_BY_ID = gql`
  query job($jobId: ID!) {
    job(id: $jobId) {
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
