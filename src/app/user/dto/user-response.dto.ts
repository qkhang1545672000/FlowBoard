import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  image?: string | null;

  @ApiProperty()
  @Expose()
  emailVerified: boolean;

  @ApiProperty()
  @Expose()
  role: string;

  @ApiProperty()
  @Expose()
  @Transform(
    ({ value }: { value: boolean | null | undefined }) => value ?? false,
  )
  isAnonymous: boolean;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  phone?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  birthday?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  gender?: string | null;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
