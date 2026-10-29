// create-sub-task.dto.ts
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsISO8601,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubTaskDto {
  @ApiProperty({ description: 'ID của Task cha' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: 'Tên công việc con' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoàn thành' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiPropertyOptional({ description: 'ID thành viên được giao việc' })
  @IsUUID()
  @IsOptional()
  assigneeId?: string | null;

  @ApiPropertyOptional({ description: 'Thời gian bắt đầu' })
  @IsISO8601()
  @IsOptional()
  startDate?: string | null;

  @ApiPropertyOptional({ description: 'Hạn chót' })
  @IsISO8601()
  @IsOptional()
  dueDate?: string | null;
}
