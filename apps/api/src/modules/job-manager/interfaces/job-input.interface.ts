export interface JobInput {
  searchTerms?: string[]
  urls?: string[]
  filters?: Record<string, any>
  [key: string]: any
}

export interface CreateJobData {
  provider: string
  input?: JobInput
  configuration?: Record<string, any>
}

export interface UpdateJobData {
  status?: string
  input?: JobInput
  currentInput?: JobInput
  processedInput?: JobInput
  remainingInput?: JobInput
  configuration?: Record<string, any>
  startedAt?: Date
  completedAt?: Date
  pausedAt?: Date
  failedAt?: Date
  duration?: number
  itemsScraped?: number
  itemsPerSecond?: number
  progressPercentage?: number
  errorMessage?: string
  errorCode?: string
  retryCount?: number
  lastRetryAt?: Date
}

export interface JobMetadata {
  startedAt?: Date
  completedAt?: Date
  pausedAt?: Date
  failedAt?: Date
  duration?: number
  errorMessage?: string
  errorCode?: string
  lastRetryAt?: Date
  itemsScraped?: number
  progressPercentage?: number
}

export interface JobProgress {
  itemsScraped: number
  progressPercentage: number
  itemsPerSecond?: number
  currentInput?: JobInput
  processedInput?: JobInput
  remainingInput?: JobInput
}

export interface PaginationParams {
  limit: number
  offset: number
}

export interface JobFilter {
  provider?: string
  status?: string
  createdAfter?: Date
  createdBefore?: Date
}

export interface PaginatedResult<T> {
  items: T[]
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
