// dto/assign-task.dto.ts
import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTaskDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách ID các user được gán vào task',
  })
  @IsArray()
  @IsUUID('7', { each: true })
  userIds: string[];

  @ApiProperty({ required: false, description: 'ID của user làm Leader Task' })
  @IsOptional()
  @IsUUID('7')
  leaderId?: string;
}
