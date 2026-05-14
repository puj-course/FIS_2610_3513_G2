// src/recetas/recetas.service.spec.ts
import { RecetasService } from './recetas.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearRecetaService } from './crear-receta.service';
import { GuardarBorradorService } from './guardar-borrador.service';
import { NotificacionesFacade } from '../telegram/NotificacionesFacade';
import { IngredienteFlyweightFactory } from '../ingredientes/flyweight/ingrediente-flyweight.factory';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload_stream: jest.fn() },
  },
}));

const cloudinaryMock = cloudinary as jest.Mocked<typeof cloudinary>;

describe('RecetasService', () => {
  let service: RecetasService;
  let prisma: any;
  let notificaciones: any;
  let flyweightFactory: any;
  let crearRecetaService: any;
  let guardarBorradorService: any;

  beforeEach(() => {
    prisma = {
      receta: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      paso: { deleteMany: jest.fn() },
      recetaingrediente: { deleteMany: jest.fn() },
      recetacategoria: { deleteMany: jest.fn() },
    };
    notificaciones = { notificarTelegram: jest.fn() };
    flyweightFactory = {
      getFlyweight: jest.fn(),
      getPool: jest.fn().mockReturnValue({}),
    };
    crearRecetaService = { ejecutar: jest.fn() };
    guardarBorradorService = { ejecutar: jest.fn() };

    service = new RecetasService(
      prisma,
      crearRecetaService,
      guardarBorradorService,
      notificaciones,
      flyweightFactory,
    );

    jest.clearAllMocks();
  });

  // ─── actualizarEstado ────────────────────────────────────────────────────────

  describe('actualizarEstado', () => {
    it('CP01 - aprueba la receta: sube imagen a Cloudinary y actualiza estado a "aprobado"', async () => {
      // Arrange
      const receta = { idreceta: 1, nombre: 'Arepas', imagenreceta: Buffer.from('img'), image_url: null };
      prisma.receta.findUnique.mockResolvedValue(receta);
      prisma.receta.update.mockResolvedValue({ ...receta, estado: 'aprobado', image_url: 'https://cdn.cloudinary.com/img.jpg' });

      (cloudinaryMock.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts: any, callback: any) => {
          callback(null, { secure_url: 'https://cdn.cloudinary.com/img.jpg' });
          return { end: jest.fn() };
        },
      );

      // Act
      await service.actualizarEstado(1, 'aprobado');

      // Assert
      expect(notificaciones.notificarTelegram).toHaveBeenCalledWith(receta);
      expect(prisma.receta.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idreceta: 1 },
          data: expect.objectContaining({ estado: 'aprobado' }),
        }),
      );
    });

    it('CP02 - rechaza la receta: no sube imagen, solo actualiza el estado', async () => {
      // Arrange
      const receta = { idreceta: 1, nombre: 'Arepas' };
      prisma.receta.findUnique.mockResolvedValue(receta);
      prisma.receta.update.mockResolvedValue({ ...receta, estado: 'rechazado' });

      // Act
      await service.actualizarEstado(1, 'rechazado');

      // Assert
      expect(notificaciones.notificarTelegram).toHaveBeenCalledWith(receta);
      expect(prisma.receta.update).toHaveBeenCalledWith({
        where: { idreceta: 1 },
        data: { estado: 'rechazado' },
      });
      expect(cloudinaryMock.uploader.upload_stream).not.toHaveBeenCalled();
    });
  });

  // ─── uploadImageCloudinary ───────────────────────────────────────────────────

  describe('uploadImageCloudinary', () => {
    it('CP03 - lanza error si la receta no existe', async () => {
      // Arrange
      prisma.receta.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.uploadImageCloudinary(99)).rejects.toThrow('Receta no encontrada');
    });

    it('CP04 - retorna la image_url existente si ya tiene URL y no hay buffer', async () => {
      // Arrange
      const receta = { idreceta: 1, image_url: 'https://ya-existe.com/img.jpg', imagenreceta: null };
      prisma.receta.findUnique.mockResolvedValue(receta);

      // Act
      const resultado = await service.uploadImageCloudinary(1);

      // Assert - no sube nada, devuelve la URL que ya tenía
      expect(cloudinaryMock.uploader.upload_stream).not.toHaveBeenCalled();
      expect(resultado).toBe('https://ya-existe.com/img.jpg');
    });

    it('CP05 - sube buffer a Cloudinary y retorna la secure_url cuando hay imagenreceta sin URL', async () => {
      // Arrange
      const receta = { idreceta: 1, image_url: null, imagenreceta: Buffer.from('datos-imagen') };
      prisma.receta.findUnique.mockResolvedValue(receta);

      (cloudinaryMock.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts: any, callback: any) => {
          callback(null, { secure_url: 'https://cdn.cloudinary.com/nueva.jpg' });
          return { end: jest.fn() };
        },
      );

      // Act
      const resultado = await service.uploadImageCloudinary(1);

      // Assert
      expect(resultado).toBe('https://cdn.cloudinary.com/nueva.jpg');
    });
  });

  // ─── eliminarReceta ──────────────────────────────────────────────────────────

  describe('eliminarReceta', () => {
    it('CP06 - elimina pasos, ingredientes, categorías y la receta en orden correcto', async () => {
      // Arrange
      prisma.paso.deleteMany.mockResolvedValue({});
      prisma.recetaingrediente.deleteMany.mockResolvedValue({});
      prisma.recetacategoria.deleteMany.mockResolvedValue({});
      prisma.receta.delete.mockResolvedValue({ idreceta: 1 });

      // Act
      await service.eliminarReceta(1);

      // Assert - verifica que se borran las relaciones antes de la receta
      expect(prisma.paso.deleteMany).toHaveBeenCalledWith({ where: { receta_idreceta: 1 } });
      expect(prisma.recetaingrediente.deleteMany).toHaveBeenCalledWith({ where: { receta_idreceta: 1 } });
      expect(prisma.recetacategoria.deleteMany).toHaveBeenCalledWith({ where: { receta_idreceta: 1 } });
      expect(prisma.receta.delete).toHaveBeenCalledWith({ where: { idreceta: 1 } });
    });
  });

});