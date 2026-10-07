import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChatScope } from 'src/shared/types/chat-scope.enum';

export class QueryMessageDto {
  @IsEnum(ChatScope)
  @IsNotEmpty()
  scope: ChatScope;

  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}
