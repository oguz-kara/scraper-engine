export interface JobEvents {
  'job.created': {
    jobId: string
    provider: string
  }
  'job.statusChanged': {
    jobId: string
    oldStatus: string
    newStatus: string
  }
  'job.progressUpdated': {
    jobId: string
    percentage: number
    itemsScraped: number
  }
  'job.completed': {
    jobId: string
    itemsScraped: number
    duration: number
  }
  'job.failed': {
    jobId: string
    error: string
    errorCode: string
  }
}

export interface QueueJobData {
  jobId: string
  provider: string
  attempt: number
}
