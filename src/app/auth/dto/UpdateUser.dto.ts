import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/shared/types/user-role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Họ và tên người dùng',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Địa chỉ email',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái xác thực email',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Đường dẫn ảnh đại diện',
    example: 'https://res.cloudinary.com/...',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Vai trò người dùng',
    example: UserRole.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Số điện thoại',
    example: '0912345678',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({
    description: 'Ngày sinh (YYYY-MM-DD)',
    example: '1995-05-20',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  birthday?: string | null;

  @ApiPropertyOptional({
    description: 'Giới tính',
    example: 'Nam',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  gender?: string | null;
}
