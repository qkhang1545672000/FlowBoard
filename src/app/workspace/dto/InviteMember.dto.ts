import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { WorkspaceRole } from 'src/shared/types/workspace-role.enum';

export class InviteMemberDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
    required: false,
  })
  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole;
}
