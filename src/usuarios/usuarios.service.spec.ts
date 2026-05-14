import {Test} from '@nestjs/testing';
import {UsuariosService} from './usuarios.service';
import {PrismaService} from '../../prisma/prisma.service';
import {ConflictException} from '@nestjs/common';
import { UsuarioNormalFactory } from './factory/usuarioNormal.factory';
import { UsuarioModeradorFactory } from './factory/usuarioModerador.factory';
import { UsuarioAdminFactory } from './factory/usuarioAdmin.factory';
import { UsuarioVerificadoFactory } from './factory/usuarioVerificado.factory';

describe('Registro UsuariosService', () => {
  let service: UsuariosService;
  let prisma: {
    usuario: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
  };

  const normalFactoryMock = {
    validarCreador: jest.fn(),
    crearDatos: jest.fn().mockReturnValue({
      nickname: 'juanito',
      email: 'juan@test.com',
      contrasena: 'hasheada',
      rol: 'usuario',
      fecha_registro: new Date(),
    }),
  };

  beforeEach(async () => {
    prisma = {
      usuario: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsuarioNormalFactory, useValue: normalFactoryMock },
        { provide: UsuarioModeradorFactory, useValue: { validarCreador: jest.fn(), crearDatos: jest.fn() } },
        { provide: UsuarioAdminFactory, useValue: { validarCreador: jest.fn(), crearDatos: jest.fn() } },
        { provide: UsuarioVerificadoFactory, useValue: { validarCreador: jest.fn(), crearDatos: jest.fn() } },
      ],
    }).compile();

    service = module.get(UsuariosService);
  });

  // CP01 - Normal
  it('CP01 - registra un usuario con datos válidos', async () => {
    // Arrange
    prisma.usuario.findFirst.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue({
      idusuario: 1,
      nickname: 'juanito',
      email: 'juan@test.com',
      rol: 'usuario',
    });

    // Act
    const resultado = await service.register({
      nickname: 'juanito',
      email: 'juan@test.com',
      contrasena: 'Segura123!',
    });

    // Assert
    expect(resultado.message).toBe('¡Cuenta creada exitosamente!');
    expect(resultado.user).toHaveProperty('idusuario');
    expect(resultado.user).toHaveProperty('nickname');
    expect(resultado.user).toHaveProperty('email');
  });


  it('CP02 - crea usuario moderador exitosamente si el rol del creador lo permite', async () => {
  // Arrange
  prisma.usuario.findFirst.mockResolvedValue(null);
  prisma.usuario.create.mockResolvedValue({
    idusuario: 2,
    nickname: 'mod1',
    email: 'mod@test.com',
    rol: 'moderador',
  });

  // Act
  const resultado = await service.crearModerador(
    { nickname: 'mod1', email: 'mod@test.com', contrasena: 'Segura123!' },
    'admin',
  );

  // Assert
  expect(resultado.message).toBe('¡Cuenta creada exitosamente!');
  expect(resultado.user).toHaveProperty('rol');
});


  it('CP03 - El usuario ingresa un correo electrónico ya en uso', async () => {
    // Arrange 
    prisma.usuario.findFirst.mockResolvedValue({  // ← esto faltaba
      idusuario: 1,
      nickname: 'juanito',
      email: 'juan@test.com',
      rol: 'usuario',
    });
    prisma.usuario.create.mockResolvedValue({
      idusuario: 2,
      nickname: 'juanito2',
      email: 'juan@test.com',
      rol: 'usuario',
    });

    // Act & Assert 
    await expect(
      service.register({
        nickname: 'juanito2', 
        email: 'juan@test.com', // correo igual al que ya existe
        contrasena: 'Segura123!',
      }),
    ).rejects.toThrow(ConflictException);
  });
  it('CP07 - convierte el correo a minúsculas antes de guardar', async () => {
    // Arrange
    prisma.usuario.findFirst.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue({
      idusuario: 1,
      nickname: 'juanito',
      email: 'juan@test.com',
      rol: 'usuario',
    });

    const normalFactoryReal = new UsuarioNormalFactory();

    // Act
    await service['crearConFactory'](
      { nickname: 'juanito', email: 'JUAN@TEST.COM', contrasena: 'Segura123!' },
      normalFactoryReal,
    );

    // Assert 
    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'juan@test.com', // en minúsculas
        }),
      }),
    );
  });
});
