export interface CheckpointConfigOptions {
  enabled?: boolean
  intervalSeconds?: number
  intervalItems?: number
  maxCheckpoints?: number
  saveOnPause?: boolean
  saveOnError?: boolean
  saveOnInterval?: boolean
}

export interface CheckpointEvent {
  jobId: string
  checkpointId?: string
  sequenceNumber?: number
  trigger: 'interval' | 'items' | 'pause' | 'error' | 'manual'
  timestamp: Date
}

export interface CheckpointStateRequest {
  jobId: string
  timeout?: number
}

export interface CheckpointStateResponse {
  jobId: string
  state: any
  timestamp: Date
}
