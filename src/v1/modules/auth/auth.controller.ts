import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';

import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import dayjs from 'dayjs';

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Token is set in access_token cookie.',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiCookieAuth('access_token')
  @ApiBody({ type: LoginDto })
  async signIn(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signIn(dto);

    const jwtExpiration = this.configService.get<string>(
      'JWT_EXPIRATION',
      '1h',
    ) as StringValue;
    const expires = dayjs().add(ms(jwtExpiration), 'milliseconds').toDate();
    expires.setTime(expires.getTime() - 1000); // Subtract 1 second to ensure the cookie expires slightly before the token

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      expires,
      sameSite: 'lax',
      path: '/',
    });

    return result;
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiCookieAuth('access_token')
  signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      path: '/',
    });
    return { message: 'Logout successful' };
  }
}
