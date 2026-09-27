import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Workspace' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'my-workspace' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ required: false, example: 'Mô tả không gian làm việc' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logo?: string;
}
