import {
  IsEmail,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendAuthEmailDto {
  @IsEmail()
  @MaxLength(320)
  to: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  url: string;
}
