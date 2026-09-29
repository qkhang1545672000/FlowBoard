import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBoardDto {
  @ApiProperty({ example: 'Product Roadmap', description: 'Tên của Board' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: '01a0e0d6-c572-70de-ab65-64358aa9ac6d',
    description: 'ID của Workspace chứa Board',
  })
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;
}
