import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { WorkspaceRole } from 'src/shared/types/workspace-role.enum';

export class AddMemberDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER_WORKSPACE,
    required: false,
  })
  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole;
}
