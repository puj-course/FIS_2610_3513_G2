import { Controller, Post, Body } from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send-otp')
  sendOtp(@Body('phone') phone: string) {
    return this.smsService.sendOtp(phone);
  }

  @Post('verify-otp')
  verifyOtp(@Body('phone') phone: string, @Body('code') code: string) {
    return this.smsService.verifyOtp(phone, code);
  }

  @Post('login-otp')
async loginOtp(
  @Body('phone') phone: string,
  @Body('code') code: string,
  @Body('email') email: string,
) {
  return this.smsService.loginOtp(phone, code, email);
}

}