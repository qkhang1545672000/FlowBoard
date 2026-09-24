import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/app/user/dto/user-response.dto';

export class MessageResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  scope: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  workspaceId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  boardId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  taskId?: string | null;

  @ApiProperty()
  @Expose()
  content: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  attachments?: any;

  @ApiProperty({ type: () => UserResponseDto })
  @Expose()
  @Type(() => UserResponseDto)
  sender: UserResponseDto;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
