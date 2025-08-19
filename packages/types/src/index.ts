export enum ScrapingProvider {
  SHELL = "SHELL",
  CASTROL = "CASTROL",
  GOOGLE = "GOOGLE",
  LINKEDIN = "LINKEDIN",
}

export enum JobStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface CreateJobInput {
  provider: ScrapingProvider;
  configuration?: Record<string, any>;
  input?: JobInput;
  priority?: number;
}

export interface JobInput {
  searchTerms?: string[];
  urls?: string[];
  filters?: Record<string, any>;
}

export interface CheckpointState {
  currentUrl: string;
  itemsProcessed: number;
  currentPage: number;
  scrollPosition?: number;
  lastItemId?: string;
  customState?: Record<string, any>;
}

export interface ScrapedData {
  deduplicationKey: string;
  rawHtml?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export enum JobEvents {
  JOB_STARTED = "job.started",
  JOB_PROGRESS = "job.progress",
  JOB_PAUSED = "job.paused",
  JOB_RESUMED = "job.resumed",
  JOB_COMPLETED = "job.completed",
  JOB_FAILED = "job.failed",
  ITEM_SCRAPED = "item.scraped",
  CHECKPOINT_SAVED = "checkpoint.saved",
}
