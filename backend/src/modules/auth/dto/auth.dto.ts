import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  passwordHash: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class TwoFADto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
