import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type BatchProcessingStats = {
  __typename?: 'BatchProcessingStats';
  activeBatches: Scalars['Int']['output'];
  completedBatches: Scalars['Int']['output'];
  estimatedTimeRemaining?: Maybe<Scalars['Int']['output']>;
  failedBatches: Scalars['Int']['output'];
  jobId: Scalars['ID']['output'];
  progress: Scalars['Float']['output'];
  totalBatches: Scalars['Int']['output'];
  waitingBatches: Scalars['Int']['output'];
};

export type CreateJobInput = {
  configuration?: InputMaybe<Scalars['JSON']['input']>;
  input?: InputMaybe<JobInputDto>;
  provider: ScrapingProvider;
};

export type CreateScrapedItemInput = {
  jobId: Scalars['ID']['input'];
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  normalizedData: Scalars['JSON']['input'];
  provider: Scalars['String']['input'];
  rawHtml: Scalars['String']['input'];
  sourceUrl?: InputMaybe<Scalars['String']['input']>;
};

export type DeduplicationResult = {
  __typename?: 'DeduplicationResult';
  checkedAt: Scalars['DateTime']['output'];
  deduplicationKey: Scalars['String']['output'];
  existingItem?: Maybe<ScrapedItem>;
  isDuplicate: Scalars['Boolean']['output'];
};

export type GetScrapedItemsInput = {
  jobId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
};

export type Job = {
  __typename?: 'Job';
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  configuration?: Maybe<Scalars['JSON']['output']>;
  createdAt: Scalars['DateTime']['output'];
  currentInput?: Maybe<Scalars['JSON']['output']>;
  duration?: Maybe<Scalars['Int']['output']>;
  errorCode?: Maybe<Scalars['String']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  failedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  input?: Maybe<Scalars['JSON']['output']>;
  itemsPerSecond?: Maybe<Scalars['Float']['output']>;
  itemsScraped: Scalars['Int']['output'];
  lastRetryAt?: Maybe<Scalars['DateTime']['output']>;
  pausedAt?: Maybe<Scalars['DateTime']['output']>;
  processedInput?: Maybe<Scalars['JSON']['output']>;
  progressPercentage: Scalars['Float']['output'];
  provider: ScrapingProvider;
  remainingInput?: Maybe<Scalars['JSON']['output']>;
  retryCount: Scalars['Int']['output'];
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  status: JobStatus;
};

export type JobConnection = {
  __typename?: 'JobConnection';
  edges: Array<Job>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  totalCount: Scalars['Int']['output'];
};

export type JobFilterInput = {
  createdAfter?: InputMaybe<Scalars['String']['input']>;
  createdBefore?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<ScrapingProvider>;
  status?: InputMaybe<JobStatus>;
};

export type JobInputDto = {
  filters?: InputMaybe<Scalars['JSON']['input']>;
  searchTerms?: InputMaybe<Array<Scalars['String']['input']>>;
  urls?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type JobPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type JobProgress = {
  __typename?: 'JobProgress';
  itemsPerSecond?: Maybe<Scalars['Float']['output']>;
  itemsScraped: Scalars['Int']['output'];
  jobId: Scalars['ID']['output'];
  percentage: Scalars['Float']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export enum JobStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Paused = 'PAUSED',
  Pending = 'PENDING',
  Running = 'RUNNING'
}

export type Mutation = {
  __typename?: 'Mutation';
  cancelJob: Job;
  createJob: Job;
  createScrapedItem: ScrapedItem;
  flushBatches: Scalars['Boolean']['output'];
  pauseJob: Job;
  processItemDirectly: Scalars['Boolean']['output'];
  resumeJob: Job;
  retryJob: Job;
  startJob: Job;
  testDeduplication: DeduplicationResult;
  testTransformation: TransformationResult;
  updateProcessorConfig: Scalars['Boolean']['output'];
};


export type MutationCancelJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateJobArgs = {
  input: CreateJobInput;
};


export type MutationCreateScrapedItemArgs = {
  input: CreateScrapedItemInput;
};


export type MutationFlushBatchesArgs = {
  jobId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationPauseJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationProcessItemDirectlyArgs = {
  input: ProcessItemDirectlyInput;
};


export type MutationResumeJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRetryJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationStartJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationTestDeduplicationArgs = {
  input: TestDeduplicationInput;
};


export type MutationTestTransformationArgs = {
  input: TestTransformationInput;
};


export type MutationUpdateProcessorConfigArgs = {
  input: UpdateProcessorConfigInput;
};

export type ProcessItemDirectlyInput = {
  jobId: Scalars['ID']['input'];
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  normalizedData: Scalars['JSON']['input'];
  provider: Scalars['String']['input'];
  rawHtml: Scalars['String']['input'];
  sourceUrl?: InputMaybe<Scalars['String']['input']>;
};

export type ProcessorStats = {
  __typename?: 'ProcessorStats';
  duplicateRate: Scalars['Float']['output'];
  duplicatesSkipped: Scalars['Int']['output'];
  itemsStored: Scalars['Int']['output'];
  jobId: Scalars['ID']['output'];
  lastProcessedAt: Scalars['DateTime']['output'];
  successRate: Scalars['Float']['output'];
  totalItems: Scalars['Int']['output'];
  transformationErrors: Scalars['Int']['output'];
};

export type ProviderStats = {
  __typename?: 'ProviderStats';
  failedTransformations: Scalars['Int']['output'];
  lastProcessedAt?: Maybe<Scalars['DateTime']['output']>;
  provider: Scalars['String']['output'];
  successfulTransformations: Scalars['Int']['output'];
  totalItems: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  getAvailableDeduplicationStrategies: Array<Scalars['String']['output']>;
  getAvailableTransformers: Array<Scalars['String']['output']>;
  getBatchProcessingStats: BatchProcessingStats;
  getProcessorStats?: Maybe<ProcessorStats>;
  getScrapedItemStats: ScrapedItemStats;
  getScrapedItems: Array<ScrapedItem>;
  job: Job;
  jobs: JobConnection;
};


export type QueryGetBatchProcessingStatsArgs = {
  jobId: Scalars['ID']['input'];
};


export type QueryGetProcessorStatsArgs = {
  jobId: Scalars['ID']['input'];
};


export type QueryGetScrapedItemStatsArgs = {
  jobId: Scalars['ID']['input'];
};


export type QueryGetScrapedItemsArgs = {
  input: GetScrapedItemsInput;
};


export type QueryJobArgs = {
  id: Scalars['ID']['input'];
};


export type QueryJobsArgs = {
  filter?: InputMaybe<JobFilterInput>;
  pagination?: InputMaybe<JobPaginationInput>;
};

export type ScrapedItem = {
  __typename?: 'ScrapedItem';
  deduplicationKey: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  jobId: Scalars['ID']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  normalizedData: Scalars['JSON']['output'];
  provider: Scalars['String']['output'];
  rawHtml: Scalars['String']['output'];
  scrapedAt: Scalars['DateTime']['output'];
  sourceUrl?: Maybe<Scalars['String']['output']>;
};

export type ScrapedItemStats = {
  __typename?: 'ScrapedItemStats';
  byProvider: Array<ProviderStats>;
  duplicatesSkipped: Scalars['Int']['output'];
  firstScrapedAt?: Maybe<Scalars['DateTime']['output']>;
  lastScrapedAt?: Maybe<Scalars['DateTime']['output']>;
  totalItems: Scalars['Int']['output'];
  uniqueItems: Scalars['Int']['output'];
};

export enum ScrapingProvider {
  Castrol = 'CASTROL',
  Google = 'GOOGLE',
  Linkedin = 'LINKEDIN',
  Shell = 'SHELL',
  Test = 'TEST'
}

export type Subscription = {
  __typename?: 'Subscription';
  itemProcessed: ScrapedItem;
  jobProgressUpdated: JobProgress;
  jobStatusChanged: Job;
  processorStatsUpdated: ProcessorStats;
};


export type SubscriptionItemProcessedArgs = {
  jobId: Scalars['ID']['input'];
};


export type SubscriptionJobProgressUpdatedArgs = {
  jobId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionJobStatusChangedArgs = {
  jobId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionProcessorStatsUpdatedArgs = {
  jobId: Scalars['ID']['input'];
};

export type TestDeduplicationInput = {
  itemData: Scalars['JSON']['input'];
  provider: Scalars['String']['input'];
  sourceUrl?: InputMaybe<Scalars['String']['input']>;
};

export type TestTransformationInput = {
  provider: Scalars['String']['input'];
  testData: Scalars['JSON']['input'];
};

export type TransformationResult = {
  __typename?: 'TransformationResult';
  data?: Maybe<Scalars['JSON']['output']>;
  errors?: Maybe<Array<Scalars['String']['output']>>;
  processingTime: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
  warnings?: Maybe<Array<Scalars['String']['output']>>;
};

export type UpdateProcessorConfigInput = {
  batchSize?: InputMaybe<Scalars['Int']['input']>;
  batchTimeoutMs?: InputMaybe<Scalars['Int']['input']>;
  enableDeduplication?: InputMaybe<Scalars['Boolean']['input']>;
  enableTransformation?: InputMaybe<Scalars['Boolean']['input']>;
  maxRetries?: InputMaybe<Scalars['Int']['input']>;
  retryDelayMs?: InputMaybe<Scalars['Int']['input']>;
  storageOptions?: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateJobMutationVariables = Exact<{
  input: CreateJobInput;
}>;


export type CreateJobMutation = { __typename?: 'Mutation', createJob: { __typename?: 'Job', completedAt?: any | null, configuration?: any | null, createdAt: any, currentInput?: any | null, duration?: number | null, errorCode?: string | null, errorMessage?: string | null, failedAt?: any | null, id: string, input?: any | null, itemsPerSecond?: number | null, itemsScraped: number, lastRetryAt?: any | null, pausedAt?: any | null, processedInput?: any | null, progressPercentage: number, provider: ScrapingProvider, remainingInput?: any | null, retryCount: number, startedAt?: any | null, status: JobStatus } };

export type StartJobMutationVariables = Exact<{
  startJobId: Scalars['ID']['input'];
}>;


export type StartJobMutation = { __typename?: 'Mutation', startJob: { __typename?: 'Job', completedAt?: any | null, configuration?: any | null, createdAt: any, currentInput?: any | null, duration?: number | null, errorCode?: string | null, errorMessage?: string | null, failedAt?: any | null, id: string, input?: any | null, itemsPerSecond?: number | null, itemsScraped: number, lastRetryAt?: any | null, pausedAt?: any | null, processedInput?: any | null, progressPercentage: number, provider: ScrapingProvider, remainingInput?: any | null, retryCount: number, startedAt?: any | null, status: JobStatus } };

export type PauseJobMutationVariables = Exact<{
  pauseJobId: Scalars['ID']['input'];
}>;


export type PauseJobMutation = { __typename?: 'Mutation', pauseJob: { __typename?: 'Job', completedAt?: any | null, configuration?: any | null, createdAt: any, currentInput?: any | null, duration?: number | null, errorCode?: string | null, errorMessage?: string | null, failedAt?: any | null, id: string, input?: any | null, itemsPerSecond?: number | null, itemsScraped: number, lastRetryAt?: any | null, pausedAt?: any | null, processedInput?: any | null, progressPercentage: number, provider: ScrapingProvider, remainingInput?: any | null, retryCount: number, startedAt?: any | null, status: JobStatus } };

export type ResumeJobMutationVariables = Exact<{
  resumeJobId: Scalars['ID']['input'];
}>;


export type ResumeJobMutation = { __typename?: 'Mutation', resumeJob: { __typename?: 'Job', completedAt?: any | null, configuration?: any | null, createdAt: any, currentInput?: any | null, duration?: number | null, errorCode?: string | null, errorMessage?: string | null, failedAt?: any | null, id: string, input?: any | null, itemsPerSecond?: number | null, itemsScraped: number, lastRetryAt?: any | null, pausedAt?: any | null, processedInput?: any | null, progressPercentage: number, provider: ScrapingProvider, remainingInput?: any | null, retryCount: number, startedAt?: any | null, status: JobStatus } };

export type RetryJobMutationVariables = Exact<{
  retryJobId: Scalars['ID']['input'];
}>;


export type RetryJobMutation = { __typename?: 'Mutation', retryJob: { __typename?: 'Job', completedAt?: any | null, configuration?: any | null, createdAt: any, currentInput?: any | null, duration?: number | null, errorCode?: string | null, errorMessage?: string | null, failedAt?: any | null, id: string, input?: any | null, itemsPerSecond?: number | null, itemsScraped: number, lastRetryAt?: any | null, pausedAt?: any | null, processedInput?: any | null, progressPercentage: number, provider: ScrapingProvider, remainingInput?: any | null, retryCount: number, startedAt?: any | null, status: JobStatus } };

export type CancelJobMutationVariables = Exact<{
  cancelJobId: Scalars['ID']['input'];
}>;


export type CancelJobMutation = { __typename?: 'Mutation', cancelJob: { __typename?: 'Job', completedAt?: any | null, configuration?: any | null, createdAt: any, currentInput?: any | null, duration?: number | null, errorCode?: string | null, errorMessage?: string | null, failedAt?: any | null, id: string, input?: any | null, itemsPerSecond?: number | null, itemsScraped: number, lastRetryAt?: any | null, pausedAt?: any | null, processedInput?: any | null, progressPercentage: number, provider: ScrapingProvider, remainingInput?: any | null, retryCount: number, startedAt?: any | null, status: JobStatus } };

export type JobsQueryVariables = Exact<{ [key: string]: never; }>;


export type JobsQuery = { __typename?: 'Query', jobs: { __typename?: 'JobConnection', hasNextPage: boolean, hasPreviousPage: boolean, totalCount: number, edges: Array<{ __typename?: 'Job', completedAt?: any | null, configuration?: any | null, createdAt: any, currentInput?: any | null, duration?: number | null, errorCode?: string | null, errorMessage?: string | null, failedAt?: any | null, id: string, input?: any | null, itemsPerSecond?: number | null, itemsScraped: number, lastRetryAt?: any | null, pausedAt?: any | null, processedInput?: any | null, progressPercentage: number, provider: ScrapingProvider, remainingInput?: any | null, retryCount: number, startedAt?: any | null, status: JobStatus }> } };

export type JobQueryVariables = Exact<{
  jobId: Scalars['ID']['input'];
}>;


export type JobQuery = { __typename?: 'Query', job: { __typename?: 'Job', completedAt?: any | null, configuration?: any | null, createdAt: any, currentInput?: any | null, duration?: number | null, errorCode?: string | null, errorMessage?: string | null, failedAt?: any | null, id: string, input?: any | null, itemsPerSecond?: number | null, itemsScraped: number, lastRetryAt?: any | null, pausedAt?: any | null, processedInput?: any | null, progressPercentage: number, provider: ScrapingProvider, remainingInput?: any | null, retryCount: number, startedAt?: any | null, status: JobStatus } };

export type GetScrapedItemsQueryVariables = Exact<{
  input: GetScrapedItemsInput;
}>;


export type GetScrapedItemsQuery = { __typename?: 'Query', getScrapedItems: Array<{ __typename?: 'ScrapedItem', id: string, jobId: string, provider: string, deduplicationKey: string, rawHtml: string, normalizedData: any, sourceUrl?: string | null, scrapedAt: any, metadata?: any | null }> };

export type GetScrapedItemStatsQueryVariables = Exact<{
  jobId: Scalars['ID']['input'];
}>;


export type GetScrapedItemStatsQuery = { __typename?: 'Query', getScrapedItemStats: { __typename?: 'ScrapedItemStats', totalItems: number, uniqueItems: number, duplicatesSkipped: number, lastScrapedAt?: any | null, firstScrapedAt?: any | null, byProvider: Array<{ __typename?: 'ProviderStats', provider: string, totalItems: number, successfulTransformations: number, failedTransformations: number, lastProcessedAt?: any | null }> } };

export type GetProcessorStatsQueryVariables = Exact<{
  jobId: Scalars['ID']['input'];
}>;


export type GetProcessorStatsQuery = { __typename?: 'Query', getProcessorStats?: { __typename?: 'ProcessorStats', jobId: string, totalItems: number, duplicatesSkipped: number, itemsStored: number, transformationErrors: number, lastProcessedAt: any, successRate: number, duplicateRate: number } | null };

export type GetBatchProcessingStatsQueryVariables = Exact<{
  jobId: Scalars['ID']['input'];
}>;


export type GetBatchProcessingStatsQuery = { __typename?: 'Query', getBatchProcessingStats: { __typename?: 'BatchProcessingStats', jobId: string, totalBatches: number, completedBatches: number, failedBatches: number, activeBatches: number, waitingBatches: number, progress: number, estimatedTimeRemaining?: number | null } };

export type GetJobWithItemsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetJobWithItemsQuery = { __typename?: 'Query', job: { __typename?: 'Job', id: string, provider: ScrapingProvider, status: JobStatus, progressPercentage: number, itemsScraped: number, remainingInput?: any | null, currentInput?: any | null, input?: any | null, createdAt: any, startedAt?: any | null, completedAt?: any | null }, getScrapedItemStats: { __typename?: 'ScrapedItemStats', totalItems: number, uniqueItems: number, duplicatesSkipped: number, lastScrapedAt?: any | null, firstScrapedAt?: any | null, byProvider: Array<{ __typename?: 'ProviderStats', provider: string, totalItems: number, successfulTransformations: number, failedTransformations: number, lastProcessedAt?: any | null }> }, getProcessorStats?: { __typename?: 'ProcessorStats', jobId: string, totalItems: number, duplicatesSkipped: number, itemsStored: number, transformationErrors: number, lastProcessedAt: any, successRate: number, duplicateRate: number } | null };

export type ProcessorStatsUpdatedSubscriptionVariables = Exact<{
  jobId: Scalars['ID']['input'];
}>;


export type ProcessorStatsUpdatedSubscription = { __typename?: 'Subscription', processorStatsUpdated: { __typename?: 'ProcessorStats', jobId: string, totalItems: number, duplicatesSkipped: number, itemsStored: number, transformationErrors: number, lastProcessedAt: any, successRate: number, duplicateRate: number } };

export type ItemProcessedSubscriptionVariables = Exact<{
  jobId: Scalars['ID']['input'];
}>;


export type ItemProcessedSubscription = { __typename?: 'Subscription', itemProcessed: { __typename?: 'ScrapedItem', id: string, jobId: string, provider: string, deduplicationKey: string, normalizedData: any, sourceUrl?: string | null, scrapedAt: any, metadata?: any | null } };

export type CheckpointCreatedSubscriptionVariables = Exact<{
  jobId: Scalars['ID']['input'];
}>;


export type CheckpointCreatedSubscription = { __typename?: 'Subscription', processorStatsUpdated: { __typename?: 'ProcessorStats', jobId: string } };

export type JobStatusChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type JobStatusChangedSubscription = { __typename?: 'Subscription', jobStatusChanged: { __typename?: 'Job', completedAt?: any | null, configuration?: any | null, createdAt: any, currentInput?: any | null, duration?: number | null, errorCode?: string | null, errorMessage?: string | null, failedAt?: any | null, id: string, input?: any | null, itemsPerSecond?: number | null, itemsScraped: number, lastRetryAt?: any | null, pausedAt?: any | null, processedInput?: any | null, progressPercentage: number, provider: ScrapingProvider, remainingInput?: any | null, retryCount: number, startedAt?: any | null, status: JobStatus } };

export type JobProgressUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type JobProgressUpdatedSubscription = { __typename?: 'Subscription', jobProgressUpdated: { __typename?: 'JobProgress', jobId: string, percentage: number, itemsScraped: number, itemsPerSecond?: number | null, timestamp: any } };


export const CreateJobDocument = gql`
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
    `;
export const StartJobDocument = gql`
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
    `;
export const PauseJobDocument = gql`
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
    `;
export const ResumeJobDocument = gql`
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
    `;
export const RetryJobDocument = gql`
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
    `;
export const CancelJobDocument = gql`
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
    `;
export const JobsDocument = gql`
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
    `;
export const JobDocument = gql`
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
    `;
export const GetScrapedItemsDocument = gql`
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
export const GetScrapedItemStatsDocument = gql`
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
export const GetProcessorStatsDocument = gql`
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
export const GetBatchProcessingStatsDocument = gql`
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
export const GetJobWithItemsDocument = gql`
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
export const ProcessorStatsUpdatedDocument = gql`
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
export const ItemProcessedDocument = gql`
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
export const CheckpointCreatedDocument = gql`
    subscription CheckpointCreated($jobId: ID!) {
  processorStatsUpdated(jobId: $jobId) {
    jobId
  }
}
    `;
export const JobStatusChangedDocument = gql`
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
    `;
export const JobProgressUpdatedDocument = gql`
    subscription jobProgressUpdated {
  jobProgressUpdated {
    jobId
    percentage
    itemsScraped
    itemsPerSecond
    timestamp
  }
}
    `;
export type Requester<C = {}> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R> | AsyncIterable<R>
export function getSdk<C>(requester: Requester<C>) {
  return {
    createJob(variables: CreateJobMutationVariables, options?: C): Promise<CreateJobMutation> {
      return requester<CreateJobMutation, CreateJobMutationVariables>(CreateJobDocument, variables, options) as Promise<CreateJobMutation>;
    },
    startJob(variables: StartJobMutationVariables, options?: C): Promise<StartJobMutation> {
      return requester<StartJobMutation, StartJobMutationVariables>(StartJobDocument, variables, options) as Promise<StartJobMutation>;
    },
    pauseJob(variables: PauseJobMutationVariables, options?: C): Promise<PauseJobMutation> {
      return requester<PauseJobMutation, PauseJobMutationVariables>(PauseJobDocument, variables, options) as Promise<PauseJobMutation>;
    },
    resumeJob(variables: ResumeJobMutationVariables, options?: C): Promise<ResumeJobMutation> {
      return requester<ResumeJobMutation, ResumeJobMutationVariables>(ResumeJobDocument, variables, options) as Promise<ResumeJobMutation>;
    },
    retryJob(variables: RetryJobMutationVariables, options?: C): Promise<RetryJobMutation> {
      return requester<RetryJobMutation, RetryJobMutationVariables>(RetryJobDocument, variables, options) as Promise<RetryJobMutation>;
    },
    cancelJob(variables: CancelJobMutationVariables, options?: C): Promise<CancelJobMutation> {
      return requester<CancelJobMutation, CancelJobMutationVariables>(CancelJobDocument, variables, options) as Promise<CancelJobMutation>;
    },
    jobs(variables?: JobsQueryVariables, options?: C): Promise<JobsQuery> {
      return requester<JobsQuery, JobsQueryVariables>(JobsDocument, variables, options) as Promise<JobsQuery>;
    },
    job(variables: JobQueryVariables, options?: C): Promise<JobQuery> {
      return requester<JobQuery, JobQueryVariables>(JobDocument, variables, options) as Promise<JobQuery>;
    },
    GetScrapedItems(variables: GetScrapedItemsQueryVariables, options?: C): Promise<GetScrapedItemsQuery> {
      return requester<GetScrapedItemsQuery, GetScrapedItemsQueryVariables>(GetScrapedItemsDocument, variables, options) as Promise<GetScrapedItemsQuery>;
    },
    GetScrapedItemStats(variables: GetScrapedItemStatsQueryVariables, options?: C): Promise<GetScrapedItemStatsQuery> {
      return requester<GetScrapedItemStatsQuery, GetScrapedItemStatsQueryVariables>(GetScrapedItemStatsDocument, variables, options) as Promise<GetScrapedItemStatsQuery>;
    },
    GetProcessorStats(variables: GetProcessorStatsQueryVariables, options?: C): Promise<GetProcessorStatsQuery> {
      return requester<GetProcessorStatsQuery, GetProcessorStatsQueryVariables>(GetProcessorStatsDocument, variables, options) as Promise<GetProcessorStatsQuery>;
    },
    GetBatchProcessingStats(variables: GetBatchProcessingStatsQueryVariables, options?: C): Promise<GetBatchProcessingStatsQuery> {
      return requester<GetBatchProcessingStatsQuery, GetBatchProcessingStatsQueryVariables>(GetBatchProcessingStatsDocument, variables, options) as Promise<GetBatchProcessingStatsQuery>;
    },
    GetJobWithItems(variables: GetJobWithItemsQueryVariables, options?: C): Promise<GetJobWithItemsQuery> {
      return requester<GetJobWithItemsQuery, GetJobWithItemsQueryVariables>(GetJobWithItemsDocument, variables, options) as Promise<GetJobWithItemsQuery>;
    },
    ProcessorStatsUpdated(variables: ProcessorStatsUpdatedSubscriptionVariables, options?: C): AsyncIterable<ProcessorStatsUpdatedSubscription> {
      return requester<ProcessorStatsUpdatedSubscription, ProcessorStatsUpdatedSubscriptionVariables>(ProcessorStatsUpdatedDocument, variables, options) as AsyncIterable<ProcessorStatsUpdatedSubscription>;
    },
    ItemProcessed(variables: ItemProcessedSubscriptionVariables, options?: C): AsyncIterable<ItemProcessedSubscription> {
      return requester<ItemProcessedSubscription, ItemProcessedSubscriptionVariables>(ItemProcessedDocument, variables, options) as AsyncIterable<ItemProcessedSubscription>;
    },
    CheckpointCreated(variables: CheckpointCreatedSubscriptionVariables, options?: C): AsyncIterable<CheckpointCreatedSubscription> {
      return requester<CheckpointCreatedSubscription, CheckpointCreatedSubscriptionVariables>(CheckpointCreatedDocument, variables, options) as AsyncIterable<CheckpointCreatedSubscription>;
    },
    jobStatusChanged(variables?: JobStatusChangedSubscriptionVariables, options?: C): AsyncIterable<JobStatusChangedSubscription> {
      return requester<JobStatusChangedSubscription, JobStatusChangedSubscriptionVariables>(JobStatusChangedDocument, variables, options) as AsyncIterable<JobStatusChangedSubscription>;
    },
    jobProgressUpdated(variables?: JobProgressUpdatedSubscriptionVariables, options?: C): AsyncIterable<JobProgressUpdatedSubscription> {
      return requester<JobProgressUpdatedSubscription, JobProgressUpdatedSubscriptionVariables>(JobProgressUpdatedDocument, variables, options) as AsyncIterable<JobProgressUpdatedSubscription>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;