import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class WorkspaceMemberResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiProperty()
  @Expose()
  role: string;
}

export class WorkspaceResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  slug: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  description?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  logo?: string | null;

  @ApiProperty({ type: [WorkspaceMemberResponseDto], required: false })
  @Expose()
  @Type(() => WorkspaceMemberResponseDto)
  members?: WorkspaceMemberResponseDto[];

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
