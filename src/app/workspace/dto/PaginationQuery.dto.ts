import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum WorkspaceFilterType {
  ALL = 'all',
  OWNED = 'owned',
  JOINED = 'joined',
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(WorkspaceFilterType)
  type?: WorkspaceFilterType = WorkspaceFilterType.ALL;
}
