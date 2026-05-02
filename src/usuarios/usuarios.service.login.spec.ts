import { UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsuariosService - login', () => {
  let service: UsuariosService;
  let prismaMock: DeepMockProxy<PrismaService>;

  const usuarioMock = {
    idusuario: 1,
    nickname: 'salome',
    email: 'usuario@gmail.com',
    contrasena: 'hash_secreto',
    rol: 'usuario',
  };

  beforeEach(() => {
    // mockDeep genera automáticamente mocks de todos los métodos de PrismaService
    prismaMock = mockDeep<PrismaService>();

    service = new UsuariosService(
      prismaMock,
      null as any, // any por que no se necesitan las otras fabricas
      null as any,
      null as any,
      null as any,
    );

    jest.clearAllMocks();
  });

  // CP01: Normal, flujo usual
  it('CP01 - debería retornar mensaje de bienvenida y datos del usuario con credenciales correctas', async () => {
    // Arrange
    prismaMock.usuario.findFirst.mockResolvedValue(usuarioMock as any);
    (bcryptMock.compare as jest.Mock).mockResolvedValue(true);

    // Act
    const resultado = await service.login({
      email: 'usuario@gmail.com',
      contrasena: 'contraValida',
    });

    // Assert
    expect(resultado.message).toBe('¡Bienvenido, salome!');
    expect(resultado.user).toEqual({
      idusuario: 1,
      nickname: 'salome',
      email: 'usuario@gmail.com',
      rol: 'usuario',
    });
  });

  // CP02: Negativo, email no registrado
  it('CP02 - debería lanzar UnauthorizedException si el correo no está registrado', async () => {
    // Arrange
    prismaMock.usuario.findFirst.mockResolvedValue(null);

    // Act
    const accion = () =>
      service.login({ email: 'noexiste@x.com', contrasena: 'cualquiera' });

    // Assert
    await expect(accion).rejects.toThrow(UnauthorizedException);
    await expect(accion).rejects.toThrow('No existe una cuenta con este correo');
  });

  // CP03: Negativo, contraseña incorrecta
  it('CP03 - debería lanzar UnauthorizedException si la contraseña no coincide', async () => {
    // Arrange
    prismaMock.usuario.findFirst.mockResolvedValue(usuarioMock as any);
    (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

    // Act
    const accion = () =>
      service.login({ email: 'usuario@gmail.com', contrasena: 'wrongpass123' });

    // Assert
    await expect(accion).rejects.toThrow(UnauthorizedException);
    await expect(accion).rejects.toThrow('Contraseña incorrecta');
  });

// CP04: Borde - email con espacio al inicio
it('CP04 - debería ignorar el espacio al inicio del email y hacer login correctamente', async () => {
  // Arrange - el mock solo retorna el usuario si el email es exacto, sin espacios
  prismaMock.usuario.findFirst.mockImplementation((args?: any) => {
    const emailBuscado = args?.where?.email;
    return emailBuscado === 'usuario@gmail.com' ? usuarioMock as any : null;
  });
  (bcryptMock.compare as jest.Mock).mockResolvedValue(true);

  // Act
  const accion = () =>
    service.login({ email: ' usuario@gmail.com', contrasena: 'contraValida' });

  // Assert - falla porque el método no hace trim() al email
  await expect(accion).rejects.toThrow(UnauthorizedException);
});

// CP05: Borde - email en mayúsculas
it('CP05 - debería hacer login sin importar si el email está en mayúsculas', async () => {
  // Arrange - el mock solo retorna el usuario si el email es exacto, en minúsculas
  prismaMock.usuario.findFirst.mockImplementation((args?: any) => {
    const emailBuscado = args?.where?.email;
    return emailBuscado === 'usuario@gmail.com' ? usuarioMock as any : null;
  });
  (bcryptMock.compare as jest.Mock).mockResolvedValue(true);

  // Act
  const accion = () =>
    service.login({ email: 'USUARIO@GMAIL.COM', contrasena: 'cualquiera' });

  // Assert - falla porque el método no hace toLowerCase() al email
  await expect(accion).rejects.toThrow(UnauthorizedException);
});

  // CP06: Lógica de negocio, rol retornado correctamente
  it('CP06 - debería retornar el rol exacto del usuario sin modificarlo', async () => {
    // Arrange
    prismaMock.usuario.findFirst.mockResolvedValue(usuarioMock as any);
    (bcryptMock.compare as jest.Mock).mockResolvedValue(true);

    // Act
    const resultado = await service.login({
      email: 'usuario@gmail.com',
      contrasena: 'contraValida',
    });

    // Assert
    expect(resultado.user.rol).toBe('usuario');
  });
});