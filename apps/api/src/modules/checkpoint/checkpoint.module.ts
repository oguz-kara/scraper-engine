import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CheckpointService } from './services/checkpoint.service'
import { CheckpointRestoreService } from './services/checkpoint-restore.service'
import { CheckpointRepository } from './repositories/checkpoint.repository'
import { JobManagerModule } from '../job-manager/job-manager.module'
import { DatabaseModule } from '../../common/database/database.module'

@Module({
  imports: [ConfigModule, JobManagerModule, DatabaseModule],
  providers: [CheckpointService, CheckpointRestoreService, CheckpointRepository],
  exports: [CheckpointService, CheckpointRestoreService],
})
export class CheckpointModule {}
