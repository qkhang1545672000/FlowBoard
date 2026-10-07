import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ChatScope } from 'src/shared/types/chat-scope.enum';

export class CreateMessageDto {
  @IsEnum(ChatScope)
  scope: ChatScope;

  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @IsOptional()
  @IsUUID()
  boardId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsArray()
  attachments?: Array<{ url: string; name?: string; type?: string }>;
}

export class QueryMessageDto {
  @IsEnum(ChatScope)
  scope: ChatScope;

  @IsUUID()
  targetId: string; // ID của task, board hoặc workspace

  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  page?: number = 1;
}
