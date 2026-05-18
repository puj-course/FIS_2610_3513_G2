import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private client: twilio.Twilio;
  private verifySid: string;

  constructor(private config: ConfigService, private prisma: PrismaService) {
    this.client = twilio(
      this.config.get('TWILIO_SID'),
      this.config.get('TWILIO_AUTH_TOKEN'),
    );
    this.verifySid = this.config.get('TWILIO_VERIFY_SID') ?? '';
  }

  async sendOtp(phone: string): Promise<{ message: string }> {
    try {
      await this.client.verify.v2
        .services(this.verifySid)
        .verifications.create({ to: phone, channel: 'sms' });

      return { message: 'Código enviado correctamente' };
    } catch (err) {
      throw new BadRequestException(`Error enviando OTP`);
    }
  }

  async verifyOtp(phone: string, code: string): Promise<{ message: string }> {
    try {
      const check = await this.client.verify.v2
        .services(this.verifySid)
        .verificationChecks.create({ to: phone, code });

      if (check.status !== 'approved') {
        throw new BadRequestException('Código incorrecto o expirado');
      }

      return { message: 'Verificación exitosa ✅' };
    } catch (err) {
      throw new BadRequestException(`Error verificando OTP`);
    }
  }

  async loginOtp(phone: string, code: string, email: string) {
  const check = await this.client.verify.v2
    .services(this.verifySid)
    .verificationChecks.create({ to: phone, code });

  if (check.status !== 'approved') {
    throw new BadRequestException('Código incorrecto o expirado');
  }

  const user = await this.prisma.usuario.findFirst({ where: { email } });
  if (!user) throw new BadRequestException('No existe un usuario con ese correo');

  return {
    message: `¡Bienvenido, ${user.nickname}!`,
    user: {
      idusuario: user.idusuario,
      nickname: user.nickname,
      email: user.email,
      rol: user.rol,
    },
  };
}
}