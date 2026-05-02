import { UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { v2 as cloudinary } from 'cloudinary';

// ─── Mock de Cloudinary ───────────────────────────────────────────────────────
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

const cloudinaryMock = cloudinary as jest.Mocked<typeof cloudinary>;

describe('UsuariosService - editarPerfil', () => {
  let service: UsuariosService;
  let prismaMock: DeepMockProxy<PrismaService>;

  const usuarioActualizadoMock = {
    idusuario: 1,
    nickname: 'salome',
    username: 'nuevo_nombre',
    email: 'usuario@gmail.com',
    rol: 'usuario',
    profile_picture_url: null,
  };

  beforeEach(() => {
    prismaMock = mockDeep<PrismaService>();
    service = new UsuariosService(
      prismaMock,
      null as any,
      null as any,
      null as any,
      null as any,
    );
    jest.clearAllMocks();
  });

  // ─── CP01: Normal - editar usuario correctamente ────────────────────────────
  it('CP01 - debería retornar mensaje de éxito y datos del usuario con username actualizado', async () => {
    // Arrange
    prismaMock.usuario.update.mockResolvedValue(usuarioActualizadoMock as any);

    // Act
    const resultado = await service.editarPerfil(1, {
      solicitanteId: 1,
      username: 'nuevo_nombre',
    });

    // Assert
    expect(resultado.message).toBe('Perfil actualizado correctamente');
    expect(resultado.usuario.username).toBe('nuevo_nombre');
  });

  // ─── CP02: Negativo - intento de editar perfil ajeno ───────────────────────
  it('CP02 - debería lanzar UnauthorizedException si solicitanteId no coincide con id', async () => {
    // Arrange
    // dto.solicitanteId = 2, id = 1 → no coinciden

    // Act
    const accion = () =>
      service.editarPerfil(1, { solicitanteId: 2, username: 'intruso' });

    // Assert
    await expect(accion).rejects.toThrow(UnauthorizedException);
    await expect(accion).rejects.toThrow('No puedes editar el perfil de otro usuario');
  });

  // ─── CP03: Negativo - fallo silencioso de Cloudinary ───────────────────────
  it('CP03 - debería guardar el perfil aunque Cloudinary falle, sin actualizar profile_picture_url', async () => {
    // Arrange
    const usuarioSinUrl = { ...usuarioActualizadoMock, profile_picture_url: null };
    prismaMock.usuario.update.mockResolvedValue(usuarioSinUrl as any);

    // Esto esta raro pero simula q cloudinary está caido o no funciona y lanza error
    (cloudinaryMock.uploader.upload_stream as jest.Mock).mockImplementation(
      (_opts: any, callback: any) => {
        callback(new Error('Cloudinary caído'), null);
        return { end: jest.fn() };
      },
    );

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const resultado = await service.editarPerfil(1, {
      solicitanteId: 1,
      imagen: 'data:image/png;base64,abc123',
    });

    // Assert
    expect(consoleSpy).toHaveBeenCalled(); // el error se capturó silenciosamente
    expect(resultado.usuario.profile_picture_url).toBeNull(); // no se actualizó la URL
    expect(resultado.message).toBe('Perfil actualizado correctamente'); // el resto sí se guardó

    consoleSpy.mockRestore();
  });

  // ─── CP04: Borde - editar perfil sin imagen ─────────────────────────────────
  it('CP04 - debería actualizar el perfil sin modificar la imagen si no se envía', async () => {
    // Arrange
    prismaMock.usuario.update.mockResolvedValue(usuarioActualizadoMock as any);

    // Act
    const resultado = await service.editarPerfil(1, {
      solicitanteId: 1,
      // sin campo imagen
    });

    // Assert
    expect(prismaMock.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idusuario: 1 } }),
    );
    expect(resultado.message).toBe('Perfil actualizado correctamente');
  });

  // ─── CP05: Borde - username vacío ───────────────────────────────────────────
  it('CP05 - debería ejecutar el update con username vacío si se envía string vacío', async () => {
    // Arrange
    // username "" !== undefined, entonces sí entra al if y se manda al update
    const usuarioConUsernameVacio = { ...usuarioActualizadoMock, username: '' };
    prismaMock.usuario.update.mockResolvedValue(usuarioConUsernameVacio as any);

    // Act
    const resultado = await service.editarPerfil(1, {
      solicitanteId: 1,
      username: '',
    });

    // Assert
    expect(prismaMock.usuario.update).toHaveBeenCalled();
    expect(resultado.usuario.username).toBe('');
  });

  // ─── CP06: Lógica de negocio, imagen actualizada sin tocar username ─────────
  it('CP06 - debería actualizar profile_picture_url con la URL de Cloudinary sin modificar el username', async () => {
    // Arrange
    const usuarioConImagen = {
      ...usuarioActualizadoMock,
      profile_picture_url: 'https://cloudinary.com/nueva-imagen.png',
    };
    prismaMock.usuario.update.mockResolvedValue(usuarioConImagen as any);

    // se simula que Cloudinary responde exitosamente con una URL
    (cloudinaryMock.uploader.upload_stream as jest.Mock).mockImplementation(
      (_opts: any, callback: any) => {
        callback(null, { secure_url: 'https://cloudinary.com/nueva-imagen.png' });
        return { end: jest.fn() };
      },
    );

    // Act
    const resultado = await service.editarPerfil(1, {
      solicitanteId: 1,
      imagen: 'data:image/png;base64,abc123',
      // sin username, no debería cambiar
    });

    // Assert
    expect(resultado.usuario.profile_picture_url).toBe('https://cloudinary.com/nueva-imagen.png');
    expect(resultado.usuario.username).toBe('nuevo_nombre'); // no se tocó
  });
});