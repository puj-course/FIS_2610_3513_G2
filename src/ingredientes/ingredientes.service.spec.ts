import { IngredientesService } from './ingredientes.service';

describe('IngredientesService', () => {
  let service: IngredientesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      ingrediente: {
        findMany: jest.fn(),
      },
    };
    service = new IngredientesService(prisma);
  });

  // autocomplete ------------------------------------------------
  // Busca ingredientes por nombre. Retorna vacío si la query
  // es muy corta (menos de 2 caracteres) para evitar queries innecesarias

  describe('autocomplete', () => {
      it('CP01 - no consulta la BD si la query tiene menos de 2 caracteres', async () => {
    // Arrange & Act
    await service.autocomplete('a');

    // Assert - protege contra queries costosas en BD
    expect(prisma.ingrediente.findMany).not.toHaveBeenCalled();
  });

  it('CP02 - busca con contains insensible a mayúsculas y limita a 10 resultados', async () => {
    // Arrange
    prisma.ingrediente.findMany.mockResolvedValue([]);

    // Act
    await service.autocomplete('Tom');

    // Assert - verifica que la query a Prisma está bien construida
    expect(prisma.ingrediente.findMany).toHaveBeenCalledWith({
      where: { nombre: { contains: 'Tom', mode: 'insensitive' } },
      select: { idingrediente: true, nombre: true },
      take: 10,
    });
  });

    it('CP03 - consulta la BD y retorna resultados cuando la query es válida', async () => {
      // Arrange
      prisma.ingrediente.findMany.mockResolvedValue([
        { idingrediente: 1, nombre: 'Tomate' },
        { idingrediente: 2, nombre: 'Tomate Cherry' },
      ]);

      // Act
      const result = await service.autocomplete('to');

      // Assert
      expect(prisma.ingrediente.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  // getAll ------------------------------------------------
  // Retorna todos los ingredientes ordenados alfabéticamente.

  describe('getAll', () => {
    it('CP04 - retorna todos los ingredientes ordenados por nombre', async () => {
      // Arrange
      prisma.ingrediente.findMany.mockResolvedValue([
        { idingrediente: 1, nombre: 'Arroz' },
        { idingrediente: 2, nombre: 'Zanahoria' },
      ]);

      // Act
      const result = await service.getAll();

      // Assert
      expect(prisma.ingrediente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { nombre: 'asc' } }),
      );
      expect(result).toHaveLength(2);
    });
  });
});