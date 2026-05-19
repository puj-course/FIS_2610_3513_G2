import { SmsService } from './sms.service';
import { BadRequestException } from '@nestjs/common';


// Se reemplaza la librería de Twilio completa por un objeto falso que imita su estructura.
// Esto permite simular respuestas de la API (código aprobado, código incorrecto, error de red)
// sin hacer llamadas reales, controlando cada escenario desde el test xd




// Tenemos que mockear twilio ya que no podemos hacer llamadas reales a su API en tests unitarios...
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    verify: {
      v2: {
        services: jest.fn().mockReturnValue({
          verifications: { create: jest.fn() },
          verificationChecks: { create: jest.fn() },
        }),
      },
    },
  }));
});

describe('SmsService', () => {
  let service: SmsService;
  let twilioMock: any;
  let prisma: any;
  let config: any;

  beforeEach(() => {
    config = { get: jest.fn().mockReturnValue('mock-value') };
    prisma = { usuario: { findFirst: jest.fn() } };
    service = new SmsService(config, prisma);
    // Accede al cliente interno para controlarlo en los tests
    twilioMock = (service as any).client;
  });

  // sendOtp ------------------------------------------------
  // Envía un código OTP por SMS al número indicado usando Twilio Verify.

  describe('sendOtp', () => {
    it('CP01 - retorna mensaje de éxito cuando Twilio responde correctamente', async () => {
      // Arrange
      twilioMock.verify.v2.services().verifications.create.mockResolvedValue({});

      // Act
      const result = await service.sendOtp('+573001234567');

      // Assert
      expect(result.message).toBe('Código enviado correctamente');
    });

    it('CP02 - lanza BadRequestException si Twilio falla', async () => {
      // Arrange
      twilioMock.verify.v2.services().verifications.create.mockRejectedValue(new Error('Twilio error'));

      // Act & Assert
      await expect(service.sendOtp('+573001234567')).rejects.toThrow(BadRequestException);
    });
  });

  // verifyOtp ------------------------------------------------
  // Verifica el código OTP. Si el status no es "approved" lanza error.

  describe('verifyOtp', () => {
    it('CP03 - retorna mensaje de éxito cuando el código es correcto', async () => {
      // Arrange
      twilioMock.verify.v2.services().verificationChecks.create.mockResolvedValue({ status: 'approved' });

      // Act
      const result = await service.verifyOtp('+573001234567', '123456');

      // Assert
      expect(result.message).toBe('Verificación exitosa ✅');
    });

    it('CP04 - lanza BadRequestException si el código no es aprobado', async () => {
      // Arrange
      twilioMock.verify.v2.services().verificationChecks.create.mockResolvedValue({ status: 'pending' });

      // Act & Assert
      await expect(service.verifyOtp('+573001234567', '000000')).rejects.toThrow(BadRequestException);
    });
  });

  // loginOtp ------------------------------------------------
  // Verifica OTP y luego busca el usuario por email para retornar sus datos.

  describe('loginOtp', () => {
    it('CP05 - retorna datos del usuario cuando OTP y email son válidos', async () => {
      // Arrange
      twilioMock.verify.v2.services().verificationChecks.create.mockResolvedValue({ status: 'approved' });
      prisma.usuario.findFirst.mockResolvedValue({
        idusuario: 1, nickname: 'alendy', email: 'a@test.com', rol: 'usuario',
      });

      // Act
      const result = await service.loginOtp('+573001234567', '123456', 'a@test.com');

      // Assert
      expect(result.user.nickname).toBe('alendy');
    });

    it('CP06 - lanza BadRequestException si no existe usuario con ese email', async () => {
      // Arrange
      twilioMock.verify.v2.services().verificationChecks.create.mockResolvedValue({ status: 'approved' });
      prisma.usuario.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.loginOtp('+573001234567', '123456', 'noexiste@test.com'))
        .rejects.toThrow(BadRequestException);
    });
  });
});