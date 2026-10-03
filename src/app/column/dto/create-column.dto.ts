// create-column.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ColumnLockType } from 'src/shared/types/column-lock-type.enum';

export class CreateColumnDto {
  @IsUUID()
  @IsNotEmpty()
  boardId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsEnum(ColumnLockType)
  lock_type?: ColumnLockType;

  @IsOptional()
  @IsNumber()
  position?: number;
}
