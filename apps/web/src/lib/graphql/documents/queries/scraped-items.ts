import { gql } from '@apollo/client';

export const GET_SCRAPED_ITEMS = gql`
  query GetScrapedItems($input: GetScrapedItemsInput!) {
    getScrapedItems(input: $input) {
      id
      jobId
      provider
      deduplicationKey
      rawHtml
      normalizedData
      sourceUrl
      scrapedAt
      metadata
    }
  }
`;

export const GET_SCRAPED_ITEM_STATS = gql`
  query GetScrapedItemStats($jobId: ID!) {
    getScrapedItemStats(jobId: $jobId) {
      totalItems
      uniqueItems
      duplicatesSkipped
      lastScrapedAt
      firstScrapedAt
      byProvider {
        provider
        totalItems
        successfulTransformations
        failedTransformations
        lastProcessedAt
      }
    }
  }
`;

export const GET_PROCESSOR_STATS = gql`
  query GetProcessorStats($jobId: ID!) {
    getProcessorStats(jobId: $jobId) {
      jobId
      totalItems
      duplicatesSkipped
      itemsStored
      transformationErrors
      lastProcessedAt
      successRate
      duplicateRate
    }
  }
`;

export const GET_BATCH_PROCESSING_STATS = gql`
  query GetBatchProcessingStats($jobId: ID!) {
    getBatchProcessingStats(jobId: $jobId) {
      jobId
      totalBatches
      completedBatches
      failedBatches
      activeBatches
      waitingBatches
      progress
      estimatedTimeRemaining
    }
  }
`;

export const GET_JOB_WITH_ITEMS = gql`
  query GetJobWithItems($id: ID!) {
    job(id: $id) {
      id
      provider
      status
      progressPercentage
      itemsScraped
      remainingInput
      currentInput
      input
      createdAt
      startedAt
      completedAt
    }
    getScrapedItemStats(jobId: $id) {
      totalItems
      uniqueItems
      duplicatesSkipped
      lastScrapedAt
      firstScrapedAt
      byProvider {
        provider
        totalItems
        successfulTransformations
        failedTransformations
        lastProcessedAt
      }
    }
    getProcessorStats(jobId: $id) {
      jobId
      totalItems
      duplicatesSkipped
      itemsStored
      transformationErrors
      lastProcessedAt
      successRate
      duplicateRate
    }
  }
`;