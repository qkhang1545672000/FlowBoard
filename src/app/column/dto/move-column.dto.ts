import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveColumnDto {
  @ApiProperty({ description: 'Vị trí mới của cột', example: 100 })
  @IsNumber()
  @IsNotEmpty()
  position: number;
}
