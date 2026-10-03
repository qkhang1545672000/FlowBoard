import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ColumnEntity } from './entities/column.entity';

import { ColumnController } from './column.controller';
import { ColumnService } from './column.service';

@Module({
  imports: [TypeOrmModule.forFeature([ColumnEntity])],
  controllers: [ColumnController],
  providers: [ColumnService],
  exports: [ColumnService],
})
export class ColumnModule {}
