import { gql } from '@apollo/client';

export const PROCESSOR_STATS_UPDATED_SUBSCRIPTION = gql`
  subscription ProcessorStatsUpdated($jobId: ID!) {
    processorStatsUpdated(jobId: $jobId) {
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

export const ITEM_PROCESSED_SUBSCRIPTION = gql`
  subscription ItemProcessed($jobId: ID!) {
    itemProcessed(jobId: $jobId) {
      id
      jobId
      provider
      deduplicationKey
      normalizedData
      sourceUrl
      scrapedAt
      metadata
    }
  }
`;

export const CHECKPOINT_CREATED_SUBSCRIPTION = gql`
  # Not supported by backend currently. Placeholder removed to avoid schema errors.
  subscription CheckpointCreated($jobId: ID!) {
    processorStatsUpdated(jobId: $jobId) {
      jobId
    }
  }
`;

// Removed unsupported checkpointRestored subscription