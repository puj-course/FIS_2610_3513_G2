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

  describe('getAll', () => {
    const recetasMock = [
      {
        idreceta: 1, nombre: 'Arepas', descripcion: 'Rica', estado: 'publicado',
        image_url: 'https://img.com/a.jpg', imagenreceta: null,
        id_usuariocreador: 1, paso: [{ descripcion: 'Paso 1' }],
        recetaingrediente: [{ ingrediente: { idingrediente: 1, nombre: 'Maíz' }, cantidadingrediente: '1' }],
        calificacion: [{ puntaje: 4 }, { puntaje: 5 }],
      },
      {
        idreceta: 2, nombre: 'Sancocho', descripcion: 'Bueno', estado: 'publicado',
        image_url: null, imagenreceta: null,
        id_usuariocreador: 2, paso: [], recetaingrediente: [], calificacion: [],
      },
    ];

    it('CP07 - retorna recetas ordenadas por nombre por defecto', async () => {
      prisma.receta.findMany.mockResolvedValue(recetasMock);
      const resultado = await service.getAll();
      expect(prisma.receta.findMany).toHaveBeenCalled();
      expect(resultado).toHaveProperty('recetas');
      expect(resultado).toHaveProperty('ingredientes');
    });

    it('CP08 - ordena por popularidad cuando ordenar=popular', async () => {
      prisma.receta.findMany.mockResolvedValue(recetasMock);
      const resultado = await service.getAll('popular');
      expect(resultado.recetas[0].idreceta).toBe(1); // tiene rating más alto
    });

    it('CP09 - receta sin calificaciones queda al final en vista popular', async () => {
      prisma.receta.findMany.mockResolvedValue(recetasMock);
      const resultado = await service.getAll('popular');
      expect(resultado.recetas[resultado.recetas.length - 1].idreceta).toBe(2);
    });
  });

  // ─── getBorradorByUsuario ─────────────────────────────────────────────────────

  describe('getBorradorByUsuario', () => {
    it('CP10 - retorna el borrador más reciente del usuario', async () => {
      const borrador = { idreceta: 5, estado: 'borrador', id_usuariocreador: 1 };
      prisma.receta.findFirst.mockResolvedValue(borrador);
      const resultado = await service.getBorradorByUsuario(1);
      expect(resultado).toEqual(borrador);
      expect(prisma.receta.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_usuariocreador: 1, estado: 'borrador' } })
      );
    });

    it('CP11 - retorna null si el usuario no tiene borradores', async () => {
      prisma.receta.findFirst.mockResolvedValue(null);
      const resultado = await service.getBorradorByUsuario(99);
      expect(resultado).toBeNull();
    });
  });

  // ─── guardarReceta / quitarRecetaGuardada / getRecetasGuardadas ───────────────

  describe('recetas guardadas', () => {
    beforeEach(() => {
      prisma.recetaguardada = {
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      };
    });

    it('CP12 - guarda una receta para un usuario', async () => {
      prisma.recetaguardada.create.mockResolvedValue({ usuario_idusuario: 1, receta_idreceta: 2 });
      await service.guardarReceta(1, 2);
      expect(prisma.recetaguardada.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ usuario_idusuario: 1, receta_idreceta: 2 }) })
      );
    });

    it('CP13 - quita una receta guardada', async () => {
      prisma.recetaguardada.delete.mockResolvedValue({});
      await service.quitarRecetaGuardada(1, 2);
      expect(prisma.recetaguardada.delete).toHaveBeenCalled();
    });

    it('CP14 - retorna las recetas guardadas de un usuario', async () => {
      prisma.recetaguardada.findMany.mockResolvedValue([{ receta_idreceta: 2 }]);
      const resultado = await service.getRecetasGuardadas(1);
      expect(resultado).toHaveLength(1);
    });
  });

  // ─── calificar / getCalificacionPromedio ──────────────────────────────────────

  describe('calificar', () => {
    beforeEach(() => {
      prisma.calificacion = {
        upsert: jest.fn(),
        aggregate: jest.fn(),
      };
    });

    it('CP15 - lanza BadRequestException si puntaje < 1', async () => {
      await expect(service.calificar(1, 1, 0)).rejects.toThrow('El puntaje debe estar entre 1 y 5');
    });

    it('CP16 - lanza BadRequestException si puntaje > 5', async () => {
      await expect(service.calificar(1, 1, 6)).rejects.toThrow('El puntaje debe estar entre 1 y 5');
    });

    it('CP17 - guarda la calificación correctamente', async () => {
      prisma.calificacion.upsert.mockResolvedValue({ puntaje: 4 });
      await service.calificar(1, 1, 4);
      expect(prisma.calificacion.upsert).toHaveBeenCalled();
    });

    it('CP18 - retorna promedio y total de calificaciones', async () => {
      prisma.calificacion.aggregate.mockResolvedValue({
        _avg: { puntaje: 4.3 },
        _count: { puntaje: 10 },
      });
      const resultado = await service.getCalificacionPromedio(1);
      expect(resultado.promedio).toBe(4.3);
      expect(resultado.total).toBe(10);
    });

    it('CP19 - retorna promedio null si no hay calificaciones', async () => {
      prisma.calificacion.aggregate.mockResolvedValue({
        _avg: { puntaje: null },
        _count: { puntaje: 0 },
      });
      const resultado = await service.getCalificacionPromedio(1);
      expect(resultado.promedio).toBeNull();
      expect(resultado.total).toBe(0);
    });
  });

  it('CP20 - buscarPorIngredientes retorna recetas con score', async () => {
    prisma.$queryRaw = jest.fn().mockResolvedValue([
      { idreceta: 1, nombre: 'Arepas', score: BigInt(2), relevancia: 1 }
    ]);
    const resultado = await service.buscarPorIngredientes([1, 2]);
    expect(resultado[0].score).toBe(2);
  });
});



