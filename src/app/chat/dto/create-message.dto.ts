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

  @IsOptional()
  @IsUUID()
  recipientId?: string; // 👈 Thêm trường này để nhận ID của người nhận khi chat 1-1 (DIRECT)

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class QueryMessageDto {
  @IsEnum(ChatScope)
  scope: ChatScope;

  @IsUUID()
  targetId: string; // ID của task, board, workspace HOẶC userId của người đang chat 1-1

  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  page?: number = 1;
}
