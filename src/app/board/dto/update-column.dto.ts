// update-column.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateColumnDto } from '../../column/dto/create-column.dto';

export class UpdateColumnDto extends PartialType(CreateColumnDto) {}
