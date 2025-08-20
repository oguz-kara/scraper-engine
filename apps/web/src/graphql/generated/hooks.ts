import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
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
export type CreateJobMutationFn = Apollo.MutationFunction<CreateJobMutation, CreateJobMutationVariables>;

/**
 * __useCreateJobMutation__
 *
 * To run a mutation, you first call `useCreateJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createJobMutation, { data, loading, error }] = useCreateJobMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateJobMutation(baseOptions?: Apollo.MutationHookOptions<CreateJobMutation, CreateJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateJobMutation, CreateJobMutationVariables>(CreateJobDocument, options);
      }
export type CreateJobMutationHookResult = ReturnType<typeof useCreateJobMutation>;
export type CreateJobMutationResult = Apollo.MutationResult<CreateJobMutation>;
export type CreateJobMutationOptions = Apollo.BaseMutationOptions<CreateJobMutation, CreateJobMutationVariables>;
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
export type StartJobMutationFn = Apollo.MutationFunction<StartJobMutation, StartJobMutationVariables>;

/**
 * __useStartJobMutation__
 *
 * To run a mutation, you first call `useStartJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useStartJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [startJobMutation, { data, loading, error }] = useStartJobMutation({
 *   variables: {
 *      startJobId: // value for 'startJobId'
 *   },
 * });
 */
export function useStartJobMutation(baseOptions?: Apollo.MutationHookOptions<StartJobMutation, StartJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<StartJobMutation, StartJobMutationVariables>(StartJobDocument, options);
      }
export type StartJobMutationHookResult = ReturnType<typeof useStartJobMutation>;
export type StartJobMutationResult = Apollo.MutationResult<StartJobMutation>;
export type StartJobMutationOptions = Apollo.BaseMutationOptions<StartJobMutation, StartJobMutationVariables>;
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
export type PauseJobMutationFn = Apollo.MutationFunction<PauseJobMutation, PauseJobMutationVariables>;

/**
 * __usePauseJobMutation__
 *
 * To run a mutation, you first call `usePauseJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePauseJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [pauseJobMutation, { data, loading, error }] = usePauseJobMutation({
 *   variables: {
 *      pauseJobId: // value for 'pauseJobId'
 *   },
 * });
 */
export function usePauseJobMutation(baseOptions?: Apollo.MutationHookOptions<PauseJobMutation, PauseJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PauseJobMutation, PauseJobMutationVariables>(PauseJobDocument, options);
      }
export type PauseJobMutationHookResult = ReturnType<typeof usePauseJobMutation>;
export type PauseJobMutationResult = Apollo.MutationResult<PauseJobMutation>;
export type PauseJobMutationOptions = Apollo.BaseMutationOptions<PauseJobMutation, PauseJobMutationVariables>;
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
export type ResumeJobMutationFn = Apollo.MutationFunction<ResumeJobMutation, ResumeJobMutationVariables>;

/**
 * __useResumeJobMutation__
 *
 * To run a mutation, you first call `useResumeJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResumeJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resumeJobMutation, { data, loading, error }] = useResumeJobMutation({
 *   variables: {
 *      resumeJobId: // value for 'resumeJobId'
 *   },
 * });
 */
export function useResumeJobMutation(baseOptions?: Apollo.MutationHookOptions<ResumeJobMutation, ResumeJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ResumeJobMutation, ResumeJobMutationVariables>(ResumeJobDocument, options);
      }
export type ResumeJobMutationHookResult = ReturnType<typeof useResumeJobMutation>;
export type ResumeJobMutationResult = Apollo.MutationResult<ResumeJobMutation>;
export type ResumeJobMutationOptions = Apollo.BaseMutationOptions<ResumeJobMutation, ResumeJobMutationVariables>;
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
export type RetryJobMutationFn = Apollo.MutationFunction<RetryJobMutation, RetryJobMutationVariables>;

/**
 * __useRetryJobMutation__
 *
 * To run a mutation, you first call `useRetryJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRetryJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [retryJobMutation, { data, loading, error }] = useRetryJobMutation({
 *   variables: {
 *      retryJobId: // value for 'retryJobId'
 *   },
 * });
 */
export function useRetryJobMutation(baseOptions?: Apollo.MutationHookOptions<RetryJobMutation, RetryJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RetryJobMutation, RetryJobMutationVariables>(RetryJobDocument, options);
      }
export type RetryJobMutationHookResult = ReturnType<typeof useRetryJobMutation>;
export type RetryJobMutationResult = Apollo.MutationResult<RetryJobMutation>;
export type RetryJobMutationOptions = Apollo.BaseMutationOptions<RetryJobMutation, RetryJobMutationVariables>;
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
export type CancelJobMutationFn = Apollo.MutationFunction<CancelJobMutation, CancelJobMutationVariables>;

/**
 * __useCancelJobMutation__
 *
 * To run a mutation, you first call `useCancelJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelJobMutation, { data, loading, error }] = useCancelJobMutation({
 *   variables: {
 *      cancelJobId: // value for 'cancelJobId'
 *   },
 * });
 */
export function useCancelJobMutation(baseOptions?: Apollo.MutationHookOptions<CancelJobMutation, CancelJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CancelJobMutation, CancelJobMutationVariables>(CancelJobDocument, options);
      }
export type CancelJobMutationHookResult = ReturnType<typeof useCancelJobMutation>;
export type CancelJobMutationResult = Apollo.MutationResult<CancelJobMutation>;
export type CancelJobMutationOptions = Apollo.BaseMutationOptions<CancelJobMutation, CancelJobMutationVariables>;
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

/**
 * __useJobsQuery__
 *
 * To run a query within a React component, call `useJobsQuery` and pass it any options that fit your needs.
 * When your component renders, `useJobsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useJobsQuery({
 *   variables: {
 *   },
 * });
 */
export function useJobsQuery(baseOptions?: Apollo.QueryHookOptions<JobsQuery, JobsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<JobsQuery, JobsQueryVariables>(JobsDocument, options);
      }
export function useJobsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<JobsQuery, JobsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<JobsQuery, JobsQueryVariables>(JobsDocument, options);
        }
export function useJobsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<JobsQuery, JobsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<JobsQuery, JobsQueryVariables>(JobsDocument, options);
        }
export type JobsQueryHookResult = ReturnType<typeof useJobsQuery>;
export type JobsLazyQueryHookResult = ReturnType<typeof useJobsLazyQuery>;
export type JobsSuspenseQueryHookResult = ReturnType<typeof useJobsSuspenseQuery>;
export type JobsQueryResult = Apollo.QueryResult<JobsQuery, JobsQueryVariables>;
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

/**
 * __useJobQuery__
 *
 * To run a query within a React component, call `useJobQuery` and pass it any options that fit your needs.
 * When your component renders, `useJobQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useJobQuery({
 *   variables: {
 *      jobId: // value for 'jobId'
 *   },
 * });
 */
export function useJobQuery(baseOptions: Apollo.QueryHookOptions<JobQuery, JobQueryVariables> & ({ variables: JobQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<JobQuery, JobQueryVariables>(JobDocument, options);
      }
export function useJobLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<JobQuery, JobQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<JobQuery, JobQueryVariables>(JobDocument, options);
        }
export function useJobSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<JobQuery, JobQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<JobQuery, JobQueryVariables>(JobDocument, options);
        }
export type JobQueryHookResult = ReturnType<typeof useJobQuery>;
export type JobLazyQueryHookResult = ReturnType<typeof useJobLazyQuery>;
export type JobSuspenseQueryHookResult = ReturnType<typeof useJobSuspenseQuery>;
export type JobQueryResult = Apollo.QueryResult<JobQuery, JobQueryVariables>;
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

/**
 * __useGetScrapedItemsQuery__
 *
 * To run a query within a React component, call `useGetScrapedItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetScrapedItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetScrapedItemsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetScrapedItemsQuery(baseOptions: Apollo.QueryHookOptions<GetScrapedItemsQuery, GetScrapedItemsQueryVariables> & ({ variables: GetScrapedItemsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetScrapedItemsQuery, GetScrapedItemsQueryVariables>(GetScrapedItemsDocument, options);
      }
export function useGetScrapedItemsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetScrapedItemsQuery, GetScrapedItemsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetScrapedItemsQuery, GetScrapedItemsQueryVariables>(GetScrapedItemsDocument, options);
        }
export function useGetScrapedItemsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetScrapedItemsQuery, GetScrapedItemsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetScrapedItemsQuery, GetScrapedItemsQueryVariables>(GetScrapedItemsDocument, options);
        }
export type GetScrapedItemsQueryHookResult = ReturnType<typeof useGetScrapedItemsQuery>;
export type GetScrapedItemsLazyQueryHookResult = ReturnType<typeof useGetScrapedItemsLazyQuery>;
export type GetScrapedItemsSuspenseQueryHookResult = ReturnType<typeof useGetScrapedItemsSuspenseQuery>;
export type GetScrapedItemsQueryResult = Apollo.QueryResult<GetScrapedItemsQuery, GetScrapedItemsQueryVariables>;
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

/**
 * __useGetScrapedItemStatsQuery__
 *
 * To run a query within a React component, call `useGetScrapedItemStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetScrapedItemStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetScrapedItemStatsQuery({
 *   variables: {
 *      jobId: // value for 'jobId'
 *   },
 * });
 */
export function useGetScrapedItemStatsQuery(baseOptions: Apollo.QueryHookOptions<GetScrapedItemStatsQuery, GetScrapedItemStatsQueryVariables> & ({ variables: GetScrapedItemStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetScrapedItemStatsQuery, GetScrapedItemStatsQueryVariables>(GetScrapedItemStatsDocument, options);
      }
export function useGetScrapedItemStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetScrapedItemStatsQuery, GetScrapedItemStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetScrapedItemStatsQuery, GetScrapedItemStatsQueryVariables>(GetScrapedItemStatsDocument, options);
        }
export function useGetScrapedItemStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetScrapedItemStatsQuery, GetScrapedItemStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetScrapedItemStatsQuery, GetScrapedItemStatsQueryVariables>(GetScrapedItemStatsDocument, options);
        }
export type GetScrapedItemStatsQueryHookResult = ReturnType<typeof useGetScrapedItemStatsQuery>;
export type GetScrapedItemStatsLazyQueryHookResult = ReturnType<typeof useGetScrapedItemStatsLazyQuery>;
export type GetScrapedItemStatsSuspenseQueryHookResult = ReturnType<typeof useGetScrapedItemStatsSuspenseQuery>;
export type GetScrapedItemStatsQueryResult = Apollo.QueryResult<GetScrapedItemStatsQuery, GetScrapedItemStatsQueryVariables>;
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

/**
 * __useGetProcessorStatsQuery__
 *
 * To run a query within a React component, call `useGetProcessorStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProcessorStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProcessorStatsQuery({
 *   variables: {
 *      jobId: // value for 'jobId'
 *   },
 * });
 */
export function useGetProcessorStatsQuery(baseOptions: Apollo.QueryHookOptions<GetProcessorStatsQuery, GetProcessorStatsQueryVariables> & ({ variables: GetProcessorStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProcessorStatsQuery, GetProcessorStatsQueryVariables>(GetProcessorStatsDocument, options);
      }
export function useGetProcessorStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProcessorStatsQuery, GetProcessorStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProcessorStatsQuery, GetProcessorStatsQueryVariables>(GetProcessorStatsDocument, options);
        }
export function useGetProcessorStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProcessorStatsQuery, GetProcessorStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetProcessorStatsQuery, GetProcessorStatsQueryVariables>(GetProcessorStatsDocument, options);
        }
export type GetProcessorStatsQueryHookResult = ReturnType<typeof useGetProcessorStatsQuery>;
export type GetProcessorStatsLazyQueryHookResult = ReturnType<typeof useGetProcessorStatsLazyQuery>;
export type GetProcessorStatsSuspenseQueryHookResult = ReturnType<typeof useGetProcessorStatsSuspenseQuery>;
export type GetProcessorStatsQueryResult = Apollo.QueryResult<GetProcessorStatsQuery, GetProcessorStatsQueryVariables>;
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

/**
 * __useGetBatchProcessingStatsQuery__
 *
 * To run a query within a React component, call `useGetBatchProcessingStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBatchProcessingStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBatchProcessingStatsQuery({
 *   variables: {
 *      jobId: // value for 'jobId'
 *   },
 * });
 */
export function useGetBatchProcessingStatsQuery(baseOptions: Apollo.QueryHookOptions<GetBatchProcessingStatsQuery, GetBatchProcessingStatsQueryVariables> & ({ variables: GetBatchProcessingStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetBatchProcessingStatsQuery, GetBatchProcessingStatsQueryVariables>(GetBatchProcessingStatsDocument, options);
      }
export function useGetBatchProcessingStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetBatchProcessingStatsQuery, GetBatchProcessingStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetBatchProcessingStatsQuery, GetBatchProcessingStatsQueryVariables>(GetBatchProcessingStatsDocument, options);
        }
export function useGetBatchProcessingStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetBatchProcessingStatsQuery, GetBatchProcessingStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetBatchProcessingStatsQuery, GetBatchProcessingStatsQueryVariables>(GetBatchProcessingStatsDocument, options);
        }
export type GetBatchProcessingStatsQueryHookResult = ReturnType<typeof useGetBatchProcessingStatsQuery>;
export type GetBatchProcessingStatsLazyQueryHookResult = ReturnType<typeof useGetBatchProcessingStatsLazyQuery>;
export type GetBatchProcessingStatsSuspenseQueryHookResult = ReturnType<typeof useGetBatchProcessingStatsSuspenseQuery>;
export type GetBatchProcessingStatsQueryResult = Apollo.QueryResult<GetBatchProcessingStatsQuery, GetBatchProcessingStatsQueryVariables>;
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

/**
 * __useGetJobWithItemsQuery__
 *
 * To run a query within a React component, call `useGetJobWithItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetJobWithItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetJobWithItemsQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetJobWithItemsQuery(baseOptions: Apollo.QueryHookOptions<GetJobWithItemsQuery, GetJobWithItemsQueryVariables> & ({ variables: GetJobWithItemsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetJobWithItemsQuery, GetJobWithItemsQueryVariables>(GetJobWithItemsDocument, options);
      }
export function useGetJobWithItemsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetJobWithItemsQuery, GetJobWithItemsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetJobWithItemsQuery, GetJobWithItemsQueryVariables>(GetJobWithItemsDocument, options);
        }
export function useGetJobWithItemsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetJobWithItemsQuery, GetJobWithItemsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetJobWithItemsQuery, GetJobWithItemsQueryVariables>(GetJobWithItemsDocument, options);
        }
export type GetJobWithItemsQueryHookResult = ReturnType<typeof useGetJobWithItemsQuery>;
export type GetJobWithItemsLazyQueryHookResult = ReturnType<typeof useGetJobWithItemsLazyQuery>;
export type GetJobWithItemsSuspenseQueryHookResult = ReturnType<typeof useGetJobWithItemsSuspenseQuery>;
export type GetJobWithItemsQueryResult = Apollo.QueryResult<GetJobWithItemsQuery, GetJobWithItemsQueryVariables>;
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

/**
 * __useProcessorStatsUpdatedSubscription__
 *
 * To run a query within a React component, call `useProcessorStatsUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useProcessorStatsUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProcessorStatsUpdatedSubscription({
 *   variables: {
 *      jobId: // value for 'jobId'
 *   },
 * });
 */
export function useProcessorStatsUpdatedSubscription(baseOptions: Apollo.SubscriptionHookOptions<ProcessorStatsUpdatedSubscription, ProcessorStatsUpdatedSubscriptionVariables> & ({ variables: ProcessorStatsUpdatedSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<ProcessorStatsUpdatedSubscription, ProcessorStatsUpdatedSubscriptionVariables>(ProcessorStatsUpdatedDocument, options);
      }
export type ProcessorStatsUpdatedSubscriptionHookResult = ReturnType<typeof useProcessorStatsUpdatedSubscription>;
export type ProcessorStatsUpdatedSubscriptionResult = Apollo.SubscriptionResult<ProcessorStatsUpdatedSubscription>;
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

/**
 * __useItemProcessedSubscription__
 *
 * To run a query within a React component, call `useItemProcessedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useItemProcessedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useItemProcessedSubscription({
 *   variables: {
 *      jobId: // value for 'jobId'
 *   },
 * });
 */
export function useItemProcessedSubscription(baseOptions: Apollo.SubscriptionHookOptions<ItemProcessedSubscription, ItemProcessedSubscriptionVariables> & ({ variables: ItemProcessedSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<ItemProcessedSubscription, ItemProcessedSubscriptionVariables>(ItemProcessedDocument, options);
      }
export type ItemProcessedSubscriptionHookResult = ReturnType<typeof useItemProcessedSubscription>;
export type ItemProcessedSubscriptionResult = Apollo.SubscriptionResult<ItemProcessedSubscription>;
export const CheckpointCreatedDocument = gql`
    subscription CheckpointCreated($jobId: ID!) {
  processorStatsUpdated(jobId: $jobId) {
    jobId
  }
}
    `;

/**
 * __useCheckpointCreatedSubscription__
 *
 * To run a query within a React component, call `useCheckpointCreatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useCheckpointCreatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCheckpointCreatedSubscription({
 *   variables: {
 *      jobId: // value for 'jobId'
 *   },
 * });
 */
export function useCheckpointCreatedSubscription(baseOptions: Apollo.SubscriptionHookOptions<CheckpointCreatedSubscription, CheckpointCreatedSubscriptionVariables> & ({ variables: CheckpointCreatedSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<CheckpointCreatedSubscription, CheckpointCreatedSubscriptionVariables>(CheckpointCreatedDocument, options);
      }
export type CheckpointCreatedSubscriptionHookResult = ReturnType<typeof useCheckpointCreatedSubscription>;
export type CheckpointCreatedSubscriptionResult = Apollo.SubscriptionResult<CheckpointCreatedSubscription>;
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

/**
 * __useJobStatusChangedSubscription__
 *
 * To run a query within a React component, call `useJobStatusChangedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useJobStatusChangedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useJobStatusChangedSubscription({
 *   variables: {
 *   },
 * });
 */
export function useJobStatusChangedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<JobStatusChangedSubscription, JobStatusChangedSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<JobStatusChangedSubscription, JobStatusChangedSubscriptionVariables>(JobStatusChangedDocument, options);
      }
export type JobStatusChangedSubscriptionHookResult = ReturnType<typeof useJobStatusChangedSubscription>;
export type JobStatusChangedSubscriptionResult = Apollo.SubscriptionResult<JobStatusChangedSubscription>;
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

/**
 * __useJobProgressUpdatedSubscription__
 *
 * To run a query within a React component, call `useJobProgressUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useJobProgressUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useJobProgressUpdatedSubscription({
 *   variables: {
 *   },
 * });
 */
export function useJobProgressUpdatedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<JobProgressUpdatedSubscription, JobProgressUpdatedSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<JobProgressUpdatedSubscription, JobProgressUpdatedSubscriptionVariables>(JobProgressUpdatedDocument, options);
      }
export type JobProgressUpdatedSubscriptionHookResult = ReturnType<typeof useJobProgressUpdatedSubscription>;
export type JobProgressUpdatedSubscriptionResult = Apollo.SubscriptionResult<JobProgressUpdatedSubscription>;