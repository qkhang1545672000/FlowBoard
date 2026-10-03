import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ example: 'Product Roadmap', description: 'Tên của Board' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'my-board', description: 'Slug của Board' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    example: 'Mô tả ngắn gọn về quy trình làm việc...',
    description: 'Mô tả chi tiết về Board',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '01a0e0d6-c572-70de-ab65-64358aa9ac6d',
    description: 'ID của Workspace chứa Board',
  })
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @ApiPropertyOptional({
    example: [
      'wsm_01a0e0d6-c572-70de-ab65-64358aa9ac6d',
      'wsm_02b0e0d6-c572-70de-ab65-64358aa9ac6e',
    ],
    description: 'Danh sách WorkspaceMember IDs tham gia Board',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[];

  @ApiPropertyOptional({
    example: 'wsm_01a0e0d6-c572-70de-ab65-64358aa9ac6d',
    description: 'WorkspaceMember ID được chọn làm Leader (Đội trưởng)',
  })
  @IsString()
  @IsOptional()
  leaderId?: string | null;
}
