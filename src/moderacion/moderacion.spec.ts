import { Test } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException, BadRequestException} from '@nestjs/common';
import { AutenticacionHandler } from './handlers/autenticacion.handler';
import { RolHandler } from './handlers/rol.handler';
import { ModeraciónAccionHandler } from './handlers/moderacion-accion.handler';
import { NotificacionesFacade } from './facades/notificaciones.facade';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ModeracionRequestDto } from './dto/moderacion-request.dto';
import { RecetasService } from '../recetas/recetas.service';
process.on('unhandledRejection', () => {});

describe('Moderación - Chain of Responsibility', () => {
  let autenticacionHandler: AutenticacionHandler;
  let rolHandler: RolHandler;
  let accionHandler: ModeraciónAccionHandler;

  let usuariosService: { getById: jest.Mock };
  let prisma: { receta: { update: jest.Mock; delete: jest.Mock } };
  let notificaciones: { notificarCambioEstado: jest.Mock };
  let nextHandler: { handle: jest.Mock };
  let recetasService: {eliminarReceta: jest.Mock };

  beforeEach(async () => {

    recetasService = {eliminarReceta: jest.fn()};

    jest.clearAllMocks();

    usuariosService = { getById: jest.fn() };
    prisma = {
      receta: {
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    notificaciones = { notificarCambioEstado: jest.fn() };
    nextHandler = { handle: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AutenticacionHandler,
        RolHandler,
        ModeraciónAccionHandler,
        { provide: UsuariosService, useValue: usuariosService },
        { provide: PrismaService, useValue: prisma },
        { provide: NotificacionesFacade, useValue: notificaciones },
        { provide: RecetasService, useValue: recetasService},
      ],
    }).compile();

    autenticacionHandler = module.get(AutenticacionHandler);
    rolHandler = module.get(RolHandler);
    accionHandler = module.get(ModeraciónAccionHandler);

    // construye la cadena
    autenticacionHandler.setNext(rolHandler).setNext(accionHandler);
  });

  const requestBase = (accion: 'aprobar' | 'rechazar' | 'eliminar', recetaId = 3): ModeracionRequestDto => ({
    usuarioId: 1,
    recetaId,
    accion,
  });

  // CP01 - Normal
  it('CP01 - administrador aprueba una receta pendiente exitosamente', async () => {
    // Arrange
    usuariosService.getById.mockResolvedValue({
      idusuario: 1,
      nickname: 'admin',
      rol: 'admin',
    });
    prisma.receta.update.mockResolvedValue({
      idreceta: 3,
      nombre: 'Arepas',
      estado: 'publicado',
    });

    // Act
    await autenticacionHandler.handle(requestBase('aprobar'));
    // Assert
    expect(prisma.receta.update).toHaveBeenCalledWith({
      where: { idreceta: 3 },
      data: { estado: 'publicado' },
    });
  });

  it('CP02 - usuario no autenticado no puede acceder al panel de moderación', async () => {
    // Arrange
    usuariosService.getById.mockResolvedValue(null);

    // Act & Assert
    await expect(
      autenticacionHandler.handle(requestBase('aprobar')),
    ).rejects.toThrow(UnauthorizedException);

    expect(prisma.receta.update).not.toHaveBeenCalled();
    expect(prisma.receta.delete).not.toHaveBeenCalled();
  });
  it('CP03 - moderador intenta eliminar una receta que no existe', async () => {
    // Arrange
    usuariosService.getById.mockResolvedValue({
      idusuario: 1,
      nickname: 'moderador1',
      rol: 'moderador',
    });

    recetasService.eliminarReceta.mockResolvedValue(null);
    // Act
    await autenticacionHandler.handle(requestBase('eliminar', 9999));
    // Assert 
    expect(recetasService.eliminarReceta).toHaveBeenCalledWith(9999);
    expect(notificaciones.notificarCambioEstado).toHaveBeenCalled();
  });
  it('CP04 - al aprobar una receta se notifica por Telegram', async () => {
    // Arrange
    usuariosService.getById.mockResolvedValue({
      idusuario: 1,
      nickname: 'admin',
      rol: 'admin',
    });
    const recetaMock = { idreceta: 3, nombre: 'Arepas', estado: 'publicado' };
    prisma.receta.update.mockResolvedValue(recetaMock);

    // Act
    await autenticacionHandler.handle(requestBase('aprobar'));

    // Assert
    expect(notificaciones.notificarCambioEstado).toHaveBeenCalledWith(
      recetaMock,
      'aprobar',
    );
  });
  it('CP05 - intenta aprobar una receta que ya está publicada', async () => {
    // Arrange
    usuariosService.getById.mockResolvedValue({
      idusuario: 1,
      nickname: 'admin',
      rol: 'admin',
    });

    prisma.receta.update.mockResolvedValue({
      idreceta: 3,
      nombre: 'Arepas',
      estado: 'publicado',
    });

    // Act
    await autenticacionHandler.handle(requestBase('aprobar'));

    // Assert 
    expect(prisma.receta.update).toHaveBeenCalledWith({
      where: { idreceta: 3 },
      data: { estado: 'publicado' },
    });
    expect(notificaciones.notificarCambioEstado).toHaveBeenCalled();
  });
   it('CP06 - acción no reconocida no ejecuta ninguna operación en base de datos', async () => {
    // Arrange
    usuariosService.getById.mockResolvedValue({
      idusuario: 1,
      nickname: 'admin',
      rol: 'admin',
    });

    // Act y Assert
    await expect(
      autenticacionHandler.handle({
        usuarioId: 1,
        recetaId: 3,
        accion: 'publicar' as any, 
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.receta.update).not.toHaveBeenCalled();
    expect(prisma.receta.delete).not.toHaveBeenCalled();
  });
});
