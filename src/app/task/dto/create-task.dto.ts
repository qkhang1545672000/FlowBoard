import {
  IsArray,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from 'src/shared/types/task-priority.enum';

export class CreateTaskDto {
  @ApiProperty({ description: 'ID của Column chứa Task' })
  @IsUUID()
  @IsNotEmpty()
  columnId: string;

  @ApiProperty({ description: 'Tiêu đề công việc' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Vị trí thứ tự sắp xếp' })
  @IsOptional()
  @IsNumber()
  position?: number;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Thời hạn hoàn thành' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'ID người thực hiện' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID của các Label đính kèm',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  labelIds?: string[];
}
