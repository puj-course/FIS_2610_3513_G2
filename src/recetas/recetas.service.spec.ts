import { RecetasService } from './recetas.service';
import { BadRequestException } from '@nestjs/common';
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

  // Se inicializan los mocks antes de cada prueba para evitar contaminación entre tests
  beforeEach(() => {
    prisma = {
      receta: {
        findUnique: jest.fn(),
        findMany:   jest.fn(),
        findFirst:  jest.fn(),
        update:     jest.fn(),
        delete:     jest.fn(),
      },
      paso:              { deleteMany: jest.fn() },
      recetaingrediente: { deleteMany: jest.fn() },
      recetacategoria:   { deleteMany: jest.fn() },
      recetaguardada: {
        create:   jest.fn(),
        delete:   jest.fn(),
        findMany: jest.fn(),
      },
      calificacion: {
        aggregate: jest.fn(),
        upsert:    jest.fn(),
      },
      $queryRaw: jest.fn(),
    };
    notificaciones       = { notificarTelegram: jest.fn() };
    flyweightFactory     = { getFlyweight: jest.fn(), getPool: jest.fn().mockReturnValue({}) };
    crearRecetaService   = { ejecutar: jest.fn() };
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

  // actualizarEstado ------------------------------------------------
  // Cambia el estado de una receta. Si es "aprobado" también sube la imagen a Cloudinary
  // y notifica por Telegram. Para cualquier otro estado solo notifica y actualiza.

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
      expect(prisma.receta.update).toHaveBeenCalledWith({ where: { idreceta: 1 }, data: { estado: 'rechazado' } });
      expect(cloudinaryMock.uploader.upload_stream).not.toHaveBeenCalled();
    });
  });

  // uploadImageCloudinary ------------------------------------------------
  // Sube la imagen en buffer de una receta a Cloudinary y retorna la URL.
  // Si la receta ya tiene URL no hace nada. Si no existe lanza error.

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

  // eliminarReceta ------------------------------------------------
  // Borra una receta y todas sus relaciones (pasos, ingredientes, categorías)
  // en el orden correcto para no violar restricciones de FK en la BD.

  // Personal note: gracias a esto nos dimos cuenta que el metodo que teniamos de borrar receta solo
  // borraba la receta sin eliminar dependencias ( pasos, ingredientes, categorias ) y quedaban cosas al aire kjsdfksj

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

  // calificar ------------------------------------------------
  // Permite a un usuario puntuar una receta entre 1 y 5.
  // Usa upsert para actualizar si ya calificó antes, o crear si es la primera vez.

  describe('calificar', () => {
    it('CP07 - lanza BadRequestException si el puntaje es menor a 1', async () => {
      // Act & Assert
      await expect(service.calificar(1, 1, 0)).rejects.toThrow(BadRequestException);
    });

    it('CP08 - lanza BadRequestException si el puntaje es mayor a 5', async () => {
      // Act & Assert
      await expect(service.calificar(1, 1, 6)).rejects.toThrow(BadRequestException);
    });

    it('CP09 - crea o actualiza calificación con puntaje válido', async () => {
      // Arrange
      prisma.calificacion.upsert.mockResolvedValue({ puntaje: 4 });

      // Act
      const result = await service.calificar(1, 1, 4);

      // Assert
      expect(prisma.calificacion.upsert).toHaveBeenCalled();
      expect(result.puntaje).toBe(4);
    });
  });

  // getCalificacionPromedio ------------------------------------------------
  // Calcula el promedio de puntajes de una receta redondeado a 1 decimal.
  // Si no tiene calificaciones retorna promedio null y total 0.

  describe('getCalificacionPromedio', () => {
    it('CP10 - retorna promedio redondeado y total cuando hay calificaciones', async () => {
      // Arrange
      prisma.calificacion.aggregate.mockResolvedValue({
        _avg: { puntaje: 3.666 },
        _count: { puntaje: 3 },
      });

      // Act
      const result = await service.getCalificacionPromedio(1);

      // Assert
      expect(result.promedio).toBe(3.7);
      expect(result.total).toBe(3);
    });

    it('CP11 - retorna promedio null cuando no hay calificaciones', async () => {
      // Arrange
      prisma.calificacion.aggregate.mockResolvedValue({
        _avg: { puntaje: null },
        _count: { puntaje: 0 },
      });

      // Act
      const result = await service.getCalificacionPromedio(1);

      // Assert
      expect(result.promedio).toBeNull();
      expect(result.total).toBe(0);
    });
  });

  // getAll ------------------------------------------------
  // Retorna todas las recetas con sus ingredientes, pasos y calificaciones.
  // Si se pasa ordenar="popular" las ordena por promedio de puntaje descendente.

  describe('getAll', () => {
    // Helper para no repetir la estructura de receta en cada test
    const recetaBase = (nombre: string, calificaciones: number[]) => ({
      idreceta: 1, nombre, descripcion: '', estado: 'publicado',
      image_url: 'http://img.com/1.jpg', id_usuariocreador: 1,
      imagenreceta: null, recetaingrediente: [], paso: [],
      calificacion: calificaciones.map(p => ({ puntaje: p })),
    });

    it('CP12 - retorna recetas sin ordenar cuando no se especifica filtro', async () => {
      // Arrange
      prisma.receta.findMany.mockResolvedValue([recetaBase('Arepa', [])]);

      // Act
      const result = await service.getAll();

      // Assert
      expect(prisma.receta.findMany).toHaveBeenCalled();
      expect(result.recetas).toHaveLength(1);
      expect(result.recetas[0].nombre).toBe('Arepa');
    });

    it('CP13 - ordena por popularidad cuando ordenar="popular" (mayor promedio primero)', async () => {
      // Arrange
      prisma.receta.findMany.mockResolvedValue([
        recetaBase('Bandeja', [1]),
        recetaBase('Arepa', [5, 3]),
      ]);

      // Act
      const result = await service.getAll('popular');

      // Assert - Arepa promedio 4 va primero, Bandeja promedio 1 va segundo
      expect(result.recetas[0].nombre).toBe('Arepa');
      expect(result.recetas[1].nombre).toBe('Bandeja');
    });

    it('CP14 - recetas sin calificaciones tienen promedio 0 en ordenamiento popular', async () => {
      // Arrange
      prisma.receta.findMany.mockResolvedValue([
        recetaBase('SinVotos', []),
        recetaBase('ConVotos', [5]),
      ]);

      // Act
      const result = await service.getAll('popular');

      // Assert
      expect(result.recetas[0].nombre).toBe('ConVotos');
    });
  });

  // guardarReceta / quitarRecetaGuardada / getRecetasGuardadas ------------------------------------------------
  // Manejo de recetas guardadas por usuario: guardar, quitar y consultar.

  describe('guardarReceta', () => {
    it('CP15 - guarda una receta para un usuario correctamente', async () => {
      // Arrange
      prisma.recetaguardada.create.mockResolvedValue({ usuario_idusuario: 1, receta_idreceta: 2 });

      // Act
      const result = await service.guardarReceta(1, 2);

      // Assert
      expect(prisma.recetaguardada.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ usuario_idusuario: 1, receta_idreceta: 2 }) }),
      );
      expect(result.receta_idreceta).toBe(2);
    });
  });

  describe('quitarRecetaGuardada', () => {
    it('CP16 - elimina la receta guardada del usuario', async () => {
      // Arrange
      prisma.recetaguardada.delete.mockResolvedValue({});

      // Act
      await service.quitarRecetaGuardada(1, 2);

      // Assert
      expect(prisma.recetaguardada.delete).toHaveBeenCalledWith({
        where: { usuario_idusuario_receta_idreceta: { usuario_idusuario: 1, receta_idreceta: 2 } },
      });
    });
  });

  describe('getRecetasGuardadas', () => {
    it('CP17 - retorna las ids de recetas guardadas por un usuario', async () => {
      // Arrange
      prisma.recetaguardada.findMany.mockResolvedValue([{ receta_idreceta: 5 }, { receta_idreceta: 8 }]);

      // Act
      const result = await service.getRecetasGuardadas(1);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].receta_idreceta).toBe(5);
    });
  });

  // getRecetaPorSlug ------------------------------------------------
  // Busca una receta publicada por su slugUrl. Retorna null si no existe.

  describe('getRecetaPorSlug', () => {
    it('CP18 - retorna la receta publicada cuyo slug corresponde al título normalizado', async () => {
  // Arrange - el slug se genera al crear la receta: "Tamales de Sañuera" → "tamales-de-sanuera"
  const recetaMock = {
    idreceta: 7,
    nombre: 'Tamales de Sañuera',
    slugUrl: 'tamales-de-sanuera',
  };
  prisma.receta.findFirst.mockResolvedValue(recetaMock);

  // Act
  const result = await service.getRecetaPorSlug('tamales-de-sanuera');

  // Assert - verifica que busca exactamente por el slug normalizado y estado publicado
  expect(prisma.receta.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({ where: { slugUrl: 'tamales-de-sanuera', estado: 'publicado' } }),
  );
  expect(result).not.toBeNull();
  expect(result!.nombre).toBe('Tamales de Sañuera');
  expect(result!.slugUrl).toBe('tamales-de-sanuera');
});

  // getBorradorByUsuario ------------------------------------------------
  // Retorna el borrador más reciente de un usuario. Retorna null si no tiene ninguno.

  describe('getBorradorByUsuario', () => {
    it('CP19 - retorna el borrador más reciente del usuario', async () => {
      // Arrange
      const borrador = { idreceta: 3, estado: 'borrador', id_usuariocreador: 1 };
      prisma.receta.findFirst.mockResolvedValue(borrador);

      // Act
      const result = await service.getBorradorByUsuario(1);

      // Assert
      expect(prisma.receta.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_usuariocreador: 1, estado: 'borrador' } }),
      );
      expect(result!.estado).toBe('borrador');
    });

    it('CP20 - retorna null si el usuario no tiene borradores', async () => {
      // Arrange
      prisma.receta.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.getBorradorByUsuario(1);

      // Assert
      expect(result).toBeNull();
    });
  });
  });

  // buscarPorIngredientes ------------------------------------------------
  // Ejecuta una query raw para buscar recetas por ingredientes y convierte
  // el score de BigInt a Number para que sea serializable.

  describe('buscarPorIngredientes', () => {
    it('CP21 - convierte el score de BigInt a Number en los resultados', async () => {
      // Arrange
      prisma.$queryRaw.mockResolvedValue([
        { idreceta: 1, nombre: 'Arepa', score: BigInt(2), relevancia: 1.0 },
      ]);

      // Act
      const result = await service.buscarPorIngredientes([1, 2]);

      // Assert
      expect(result[0].score).toBe(2);
      expect(typeof result[0].score).toBe('number');
    });

    it('CP22 - retorna arreglo vacío si ninguna receta coincide con los ingredientes', async () => {
      // Arrange
      prisma.$queryRaw.mockResolvedValue([]);

      // Act
      const result = await service.buscarPorIngredientes([99]);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  // crearReceta / guardarBorrador ------------------------------------------------
  // Ambos métodos delegan directamente a sus respectivos servicios,
  // el service actúa como fachada para mantener un único punto de entrada.

  describe('crearReceta', () => {
    it('CP23 - delega la creación al crearRecetaService', async () => {
      // Arrange
      const dto = { titulo: 'Arepa' } as any;
      crearRecetaService.ejecutar.mockResolvedValue({ idreceta: 1 });

      // Act
      await service.crearReceta(dto);

      // Assert
      expect(crearRecetaService.ejecutar).toHaveBeenCalledWith(dto);
    });
  });

  describe('guardarBorrador', () => {
    it('CP24 - delega el guardado al guardarBorradorService', async () => {
      // Arrange
      const dto = { titulo: 'Borrador' } as any;
      guardarBorradorService.ejecutar.mockResolvedValue({ idreceta: 2 });

      // Act
      await service.guardarBorrador(dto);

      // Assert
      expect(guardarBorradorService.ejecutar).toHaveBeenCalledWith(dto);
    });
  });

});