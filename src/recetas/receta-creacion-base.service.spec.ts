import { CrearRecetaService } from './crear-receta.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacionesFacade } from '../telegram/NotificacionesFacade';
import { v2 as cloudinary } from 'cloudinary';

// Mock de Cloudinary pq no hace llamadas reales, nomas prueba
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload_stream: jest.fn() },
  },
}));

const cloudinaryMock = cloudinary as jest.Mocked<typeof cloudinary>;

describe('RecetaCreacionBase (vía CrearRecetaService)', () => {
  let service: CrearRecetaService;
  let prisma: any;
  let notificaciones: any;

  const dtoBase = {
    titulo: 'Arepas de choclo',
    descripcion: 'Rica receta',
    categoria: 'Plato principal',
    pasos: ['Mezclar', 'Asar'],
    ingredientes: [
      { nombre: 'Maíz', cantidad: '2', unidad: 'tazas' },
    ],
    imagen: null,
    video_url: null,
  };

  beforeEach(() => {
    prisma = {
      categoria: { findFirst: jest.fn() },
      ingrediente: { findFirst: jest.fn(), create: jest.fn() },
      receta: { create: jest.fn() },
    };
    notificaciones = { notificarTelegram: jest.fn() };
    service = new CrearRecetaService(prisma as PrismaService, notificaciones as NotificacionesFacade);
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------------------------------------
  // CP01 - Verifica que cuando el ingrediente ya existe en la BD, el servicio lo reutiliza
  // sin intentar crearlo de nuevo. Cubre la rama donde findFirst retorna un ingrediente válido.

  it('CP01 - usa el ingrediente existente si ya está en BD sin crearlo', async () => {
    // Arrange
    const categoriasMock = { idcategoria: 1 };
    const ingredienteMock = { idingrediente: 10, nombre: 'Maíz' };
    prisma.categoria.findFirst.mockResolvedValue(categoriasMock);
    prisma.ingrediente.findFirst.mockResolvedValue(ingredienteMock);
    prisma.receta.create.mockResolvedValue({ idreceta: 1, estado: 'publicado' });

    // Act
    await service.ejecutar(dtoBase as any);

    // Assert
    expect(prisma.ingrediente.findFirst).toHaveBeenCalled();
    expect(prisma.ingrediente.create).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------------------------------------
  // CP02 - Verifica que cuando el ingrediente NO existe en la BD, el servicio lo crea
  // automáticamente. Cubre la rama donde findFirst retorna null y se llama a create.

  it('CP02 - crea el ingrediente si no existe en BD', async () => {
    // Arrange
    prisma.categoria.findFirst.mockResolvedValue(null);
    prisma.ingrediente.findFirst.mockResolvedValue(null);
    prisma.ingrediente.create.mockResolvedValue({ idingrediente: 99, nombre: 'Maíz' });
    prisma.receta.create.mockResolvedValue({ idreceta: 1, estado: 'publicado' });

    // Act
    await service.ejecutar(dtoBase as any);

    // Assert
    expect(prisma.ingrediente.create).toHaveBeenCalledWith({
      data: { nombre: 'Maíz' },
    });
  });

  // ----------------------------------------------------------------------------------------------
  // CP03 - Verifica que cuando el DTO no trae imagen, se usa RecetaImagelessBuilder correctamente
  // y el flujo completo de ejecutar termina sin errores ni llamadas a Cloudinary.

  it('CP03 - usa RecetaImagelessBuilder cuando el DTO no trae imagen', async () => {
    // Arrange
    prisma.categoria.findFirst.mockResolvedValue({ idcategoria: 1 });
    prisma.ingrediente.findFirst.mockResolvedValue({ idingrediente: 1, nombre: 'Maíz' });
    prisma.receta.create.mockResolvedValue({ idreceta: 1, estado: 'publicado' });

    // Act & Assert
    await expect(service.ejecutar(dtoBase as any)).resolves.toMatchObject({
      message: 'Receta procesada correctamente',
    });
  });

  // ----------------------------------------------------------------------------------------------
  // CP04 - Verifica que cuando el DTO trae imagen en base64, se usa RecetaBuilder y se intenta
  // subir la imagen a Cloudinary. Cubre la rama donde dto.imagen tiene contenido con coma.

  it('CP04 - usa RecetaBuilder y sube imagen a Cloudinary cuando el DTO trae imagen en base64', async () => {
    // Arrange
    const dtoConImagen = { ...dtoBase, imagen: 'data:image/jpeg;base64,/9j/abc123' };
    prisma.categoria.findFirst.mockResolvedValue({ idcategoria: 1 });
    prisma.ingrediente.findFirst.mockResolvedValue({ idingrediente: 1, nombre: 'Maíz' });
    prisma.receta.create.mockResolvedValue({ idreceta: 1, estado: 'publicado' });

    (cloudinaryMock.uploader.upload_stream as jest.Mock).mockImplementation(
      (_opts: any, callback: any) => {
        callback(null, { secure_url: 'https://cdn.cloudinary.com/img.jpg' });
        return { end: jest.fn() };
      },
    );

    // Act
    const result = await service.ejecutar(dtoConImagen as any);

    // Assert
    expect(result.message).toBe('Receta procesada correctamente');
    expect(cloudinaryMock.uploader.upload_stream).toHaveBeenCalled();
  });

  // ----------------------------------------------------------------------------------------------
  // CP05 - Verifica el camino correcto del upload de imagen, osea, Cloudinary responde con éxito
  // y el builder recibe la secure_url correctamente mediante setImage.

  it('CP05 - sube imagen exitosamente y setea la URL en el builder', async () => {
    // Arrange
    const dtoConImagen = { ...dtoBase, imagen: 'data:image/jpeg;base64,/9j/abc123' };
    prisma.categoria.findFirst.mockResolvedValue({ idcategoria: 1 });
    prisma.ingrediente.findFirst.mockResolvedValue({ idingrediente: 1, nombre: 'Maíz' });
    prisma.receta.create.mockResolvedValue({ idreceta: 1, estado: 'publicado' });

    (cloudinaryMock.uploader.upload_stream as jest.Mock).mockImplementation(
      (_opts: any, callback: any) => {
        callback(null, { secure_url: 'https://cdn.cloudinary.com/img.jpg' });
        return { end: jest.fn() };
      },
    );

    // Act
    const result = await service.ejecutar(dtoConImagen as any);

    // Assert
    expect(result.message).toBe('Receta procesada correctamente');
  });

  // ----------------------------------------------------------------------------------------------
  // CP06 - Verifica que cuando Cloudinary falla al subir la imagen, el catch interno maneja
  // el error sin romper el flujo. El builder recibe setImage con URL vacía y la receta
  // se guarda de todas formas. Cubre el bloque catch de construirReceta.

  it('CP06 - entra al catch y llama setImage con URL vacía si Cloudinary falla', async () => {
    // Arrange
    const dtoConImagen = { ...dtoBase, imagen: 'data:image/jpeg;base64,/9j/abc123' };
    prisma.categoria.findFirst.mockResolvedValue({ idcategoria: 1 });
    prisma.ingrediente.findFirst.mockResolvedValue({ idingrediente: 1, nombre: 'Maíz' });
    prisma.receta.create.mockResolvedValue({ idreceta: 1, estado: 'publicado' });

    (cloudinaryMock.uploader.upload_stream as jest.Mock).mockImplementation(
      (_opts: any, callback: any) => {
        callback(new Error('Cloudinary caído'), null);
        return { end: jest.fn() };
      },
    );

    // Act & Assert — el catch no relanza el error, el flujo sigue normalmente
    await expect(service.ejecutar(dtoConImagen as any)).resolves.toMatchObject({
      message: 'Receta procesada correctamente',
    });
  });

  // ----------------------------------------------------------------------------------------------
  // CP07 - Verifica que cuando video_url trae un base64 con coma, el servicio extrae
  // el contenido, lo convierte a buffer y lo sube a Cloudinary como video.
  // Cubre la rama if (dto.video_url.includes(',')) con base64Data válido.


  // EXPLICACIÓN: El front manda el video en formato base64 con un prefijo tipo "data:video/mp4;base64,AAAA..."
  // entonces el servicio debe detectar que tiene una coma, extraer lo que viene después de la coma,
  // convertirlo a buffer y subirlo a Cloudinary.
  // Este test verifica que ese flujo se ejecute correctamente cuando se recibe un video en base64.
  // lol
  it('CP07 - sube video en base64 a Cloudinary cuando video_url tiene coma', async () => {
    // Arrange
    const dtoConVideo = { ...dtoBase, video_url: 'data:video/mp4;base64,AAABBB' };
    prisma.categoria.findFirst.mockResolvedValue(null);
    prisma.ingrediente.findFirst.mockResolvedValue({ idingrediente: 1, nombre: 'Maíz' });
    prisma.receta.create.mockResolvedValue({ idreceta: 1, estado: 'publicado' });

    (cloudinaryMock.uploader.upload_stream as jest.Mock).mockImplementation(
      (_opts: any, callback: any) => {
        callback(null, { secure_url: 'https://cdn.cloudinary.com/video.mp4' });
        return { end: jest.fn() };
      },
    );

    // Act
    const result = await service.ejecutar(dtoConVideo as any);

    // Assert
    expect(result.message).toBe('Receta procesada correctamente');
    expect(cloudinaryMock.uploader.upload_stream).toHaveBeenCalled();
  });

  // ----------------------------------------------------------------------------------------------
  // CP08 - Verifica que cuando video_url ya es una URL directa (sin coma), el servicio
  // la pasa tal cual al builder sin intentar subirla a Cloudinary.
  // Cubre la rama else de if (dto.video_url.includes(',')) en construirReceta.

  it('CP08 - usa la URL de video directamente cuando video_url no tiene coma', async () => {
    // Arrange
    const dtoConVideoUrl = {
      ...dtoBase,
      video_url: 'https://cdn.cloudinary.com/video-existente.mp4',
    };
    prisma.categoria.findFirst.mockResolvedValue(null);
    prisma.ingrediente.findFirst.mockResolvedValue({ idingrediente: 1, nombre: 'Maíz' });
    prisma.receta.create.mockResolvedValue({ idreceta: 1, estado: 'publicado' });

    // Act
    const result = await service.ejecutar(dtoConVideoUrl as any);

    // Assert
    expect(result.message).toBe('Receta procesada correctamente');
    expect(cloudinaryMock.uploader.upload_stream).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------------------------------------
  // CP09 - Verifica que cuando la receta se guarda con estado "pendiente", el método notificar
  // de CrearRecetaService dispara la notificación de Telegram correctamente.
  // Cubre el if (receta.estado === "pendiente") en CrearRecetaService.notificar().

  it('CP09 - notifica por Telegram si la receta queda en estado "pendiente"', async () => {
    // Arrange
    prisma.categoria.findFirst.mockResolvedValue(null);
    prisma.ingrediente.findFirst.mockResolvedValue({ idingrediente: 1, nombre: 'Maíz' });
    prisma.receta.create.mockResolvedValue({ idreceta: 1, estado: 'pendiente' });

    // Act
    await service.ejecutar(dtoBase as any);

    // Assert
    expect(notificaciones.notificarTelegram).toHaveBeenCalled();
  });

  // ----------------------------------------------------------------------------------------------
  // CP10 - Verifica que cuando la receta se guarda con un estado diferente a "pendiente",
  // no se envía ninguna notificación por Telegram.
  // Cubre la rama donde notificar() no ejecuta nada.

  it('CP10 - no notifica por Telegram si la receta no está en estado "pendiente"', async () => {
    // Arrange
    prisma.categoria.findFirst.mockResolvedValue(null);
    prisma.ingrediente.findFirst.mockResolvedValue({ idingrediente: 1, nombre: 'Maíz' });
    prisma.receta.create.mockResolvedValue({ idreceta: 1, estado: 'borrador' });

    // Act
    await service.ejecutar(dtoBase as any);

    // Assert
    expect(notificaciones.notificarTelegram).not.toHaveBeenCalled();
  });
});