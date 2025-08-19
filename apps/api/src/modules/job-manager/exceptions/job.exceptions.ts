import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { JobStatus } from '../dto/update-job.input'
import { JobErrorCode } from '../enums/job-error-code.enum'

export class JobNotFoundException extends NotFoundException {
  constructor(jobId: string) {
    super({
      message: `Job ${jobId} not found`,
      extensions: {
        code: JobErrorCode.JOB_NOT_FOUND,
        jobId,
        timestamp: new Date().toISOString(),
      },
    })
  }
}

export class InvalidStateTransitionException extends BadRequestException {
  constructor(jobId: string, currentStatus: JobStatus, targetStatus: JobStatus) {
    super({
      message: `Cannot transition from ${currentStatus} to ${targetStatus}`,
      extensions: {
        code: JobErrorCode.INVALID_STATE_TRANSITION,
        jobId,
        currentStatus,
        targetStatus,
        timestamp: new Date().toISOString(),
      },
    })
  }
}

export class JobAlreadyRunningException extends ConflictException {
  constructor(jobId: string) {
    super({
      message: `Job ${jobId} is already running`,
      extensions: {
        code: JobErrorCode.JOB_ALREADY_RUNNING,
        jobId,
        timestamp: new Date().toISOString(),
      },
    })
  }
}

export class JobCannotBePausedException extends BadRequestException {
  constructor(jobId: string, currentStatus: JobStatus) {
    super({
      message: `Job ${jobId} cannot be paused from ${currentStatus} status`,
      extensions: {
        code: JobErrorCode.JOB_CANNOT_BE_PAUSED,
        jobId,
        currentStatus,
        timestamp: new Date().toISOString(),
      },
    })
  }
}

export class JobCannotBeResumedException extends BadRequestException {
  constructor(jobId: string, currentStatus: JobStatus) {
    super({
      message: `Job ${jobId} cannot be resumed from ${currentStatus} status`,
      extensions: {
        code: JobErrorCode.JOB_CANNOT_BE_RESUMED,
        jobId,
        currentStatus,
        timestamp: new Date().toISOString(),
      },
    })
  }
}

export class JobCannotBeCancelledException extends BadRequestException {
  constructor(jobId: string, currentStatus: JobStatus) {
    super({
      message: `Job ${jobId} cannot be cancelled from ${currentStatus} status`,
      extensions: {
        code: JobErrorCode.JOB_CANNOT_BE_CANCELLED,
        jobId,
        currentStatus,
        timestamp: new Date().toISOString(),
      },
    })
  }
}

export class JobProcessingFailedException extends BadRequestException {
  constructor(jobId: string, error: string) {
    super({
      message: `Job ${jobId} processing failed: ${error}`,
      extensions: {
        code: JobErrorCode.JOB_PROCESSING_FAILED,
        jobId,
        error,
        timestamp: new Date().toISOString(),
      },
    })
  }
}

export class InvalidInputFormatException extends BadRequestException {
  constructor(message: string) {
    super({
      message: `Invalid input format: ${message}`,
      extensions: {
        code: JobErrorCode.INVALID_INPUT_FORMAT,
        timestamp: new Date().toISOString(),
      },
    })
  }
}

export class ProviderNotSupportedException extends BadRequestException {
  constructor(provider: string) {
    super({
      message: `Provider ${provider} is not supported`,
      extensions: {
        code: JobErrorCode.PROVIDER_NOT_SUPPORTED,
        provider,
        timestamp: new Date().toISOString(),
      },
    })
  }
}
