import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveTaskDto {
  @ApiProperty({ description: 'ID của Column đích' })
  @IsUUID()
  @IsNotEmpty()
  columnId: string;

  @ApiProperty({ description: 'Vị trí position mới' })
  @IsNumber()
  @IsNotEmpty()
  position: number;
}
