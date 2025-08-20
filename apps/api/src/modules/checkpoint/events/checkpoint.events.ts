export interface CheckpointCreatedEvent {
  jobId: string
  checkpointId: string
  sequenceNumber: number
  trigger: 'interval' | 'items' | 'pause' | 'error' | 'manual'
  timestamp: Date
}

export interface CheckpointRestoredEvent {
  jobId: string
  checkpointId: string
  sequenceNumber: number
  itemsScraped: number
  timestamp: Date
}

export interface CheckpointStateRequestEvent {
  jobId: string
  timeout?: number
}

export interface CheckpointStateProvidedEvent {
  jobId: string
  state: any
  timestamp: Date
}

export interface CheckpointRecoveryEvent {
  jobId: string
  checkpointId: string
  error: string
  timestamp: Date
}

export const CHECKPOINT_EVENTS = {
  CREATED: 'checkpoint.created',
  RESTORED: 'checkpoint.restored',
  REQUEST_STATE: 'checkpoint.requestState',
  STATE_PROVIDED: 'checkpoint.stateProvided',
  RECOVERY: 'checkpoint.recovery',
} as const
