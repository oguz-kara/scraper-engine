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
    jobStatusChanged(variables?: JobStatusChangedSubscriptionVariables, options?: C): AsyncIterable<JobStatusChangedSubscription> {
      return requester<JobStatusChangedSubscription, JobStatusChangedSubscriptionVariables>(JobStatusChangedDocument, variables, options) as AsyncIterable<JobStatusChangedSubscription>;
    },
    jobProgressUpdated(variables?: JobProgressUpdatedSubscriptionVariables, options?: C): AsyncIterable<JobProgressUpdatedSubscription> {
      return requester<JobProgressUpdatedSubscription, JobProgressUpdatedSubscriptionVariables>(JobProgressUpdatedDocument, variables, options) as AsyncIterable<JobProgressUpdatedSubscription>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;