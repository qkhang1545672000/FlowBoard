import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityLogDto {
  @ApiProperty({ description: 'ID của Board liên quan' })
  @IsUUID()
  @IsNotEmpty()
  boardId: string;

  @ApiProperty({
    description: 'Hành động được thực hiện (ví dụ: CREATED_TASK, MOVED_CARD)',
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    description: 'Loại đối tượng bị tác động (ví dụ: TASK, COLUMN, BOARD)',
  })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ description: 'ID của đối tượng bị tác động' })
  @IsUUID()
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional({ description: 'Chi tiết thay đổi dạng JSON' })
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}
