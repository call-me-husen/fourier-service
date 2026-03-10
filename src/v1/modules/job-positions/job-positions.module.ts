import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPosition } from '../../../shared/entities/job-position.entity';
import { JobPositionService } from './job-position.service';
import { JobPositionController } from './job-position.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JobPosition])],
  controllers: [JobPositionController],
  providers: [JobPositionService],
  exports: [JobPositionService],
})
export class JobPositionsModule {}
