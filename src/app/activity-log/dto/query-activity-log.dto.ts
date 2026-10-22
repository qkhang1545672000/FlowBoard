import { IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryActivityLogDto {
  @ApiPropertyOptional({ description: 'Lọc theo Board ID' })
  @IsOptional()
  @IsUUID()
  boardId?: string;

  @ApiPropertyOptional({ description: 'Số trang hiện tại', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng bản ghi mỗi trang',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
