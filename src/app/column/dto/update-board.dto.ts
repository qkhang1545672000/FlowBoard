import { PartialType } from '@nestjs/swagger';
import { CreateBoardDto } from '../../board/dto/create-board.dto';

export class UpdateBoardDto extends PartialType(CreateBoardDto) {}
