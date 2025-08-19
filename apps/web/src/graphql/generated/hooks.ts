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

export type CreateJobInput = {
  configuration?: InputMaybe<Scalars['JSON']['input']>;
  input?: InputMaybe<JobInputDto>;
  provider: ScrapingProvider;
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
  pauseJob: Job;
  resumeJob: Job;
  retryJob: Job;
  startJob: Job;
};


export type MutationCancelJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateJobArgs = {
  input: CreateJobInput;
};


export type MutationPauseJobArgs = {
  id: Scalars['ID']['input'];
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

export type Query = {
  __typename?: 'Query';
  job: Job;
  jobs: JobConnection;
};


export type QueryJobArgs = {
  id: Scalars['ID']['input'];
};


export type QueryJobsArgs = {
  filter?: InputMaybe<JobFilterInput>;
  pagination?: InputMaybe<JobPaginationInput>;
};

export enum ScrapingProvider {
  Castrol = 'CASTROL',
  Google = 'GOOGLE',
  Linkedin = 'LINKEDIN',
  Shell = 'SHELL'
}

export type Subscription = {
  __typename?: 'Subscription';
  jobProgressUpdated: JobProgress;
  jobStatusChanged: Job;
};


export type SubscriptionJobProgressUpdatedArgs = {
  jobId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionJobStatusChangedArgs = {
  jobId?: InputMaybe<Scalars['ID']['input']>;
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