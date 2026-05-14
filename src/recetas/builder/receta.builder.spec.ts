
import { RecetaBuilder } from './receta.builder';
import { CrearRecetaDto } from '../dto/crear-receta.dto';

describe('RecetaBuilder - setDatosBase', () => {
  let builder: RecetaBuilder;

  beforeEach(() => {
    // No hay dependencias, se instancia directo (principio Independent de FIRST)
    builder = new RecetaBuilder();
  });

  // ----- CP01: Normal - todos los campos bien --------------------------------------------------
  it('CP01 - debería asignar todos los campos del DTO exactamente sin aplicar defaults', () => {
    // Arrange
    const dto: CrearRecetaDto = {
      titulo: 'Pasta',
      descripcion: 'Rica',
      tiempopreparacion: '30min',
      calorias: '500',
      estado: 'publicado',
      id_usuariocreador: 1,
      video_url: 'https://video.com/pasta',
      categoria: 'italiana',
      ingredientes: [],
      pasos: [],
    };

    // Act
    const resultado = builder.setDatosBase(dto).build() as any;

    // Assert
    expect(resultado.nombre).toBe('Pasta');
    expect(resultado.descripcion).toBe('Rica');
    expect(resultado.tiempopreparacion).toBe('30min');
    expect(resultado.calorias).toBe('500');
    expect(resultado.estado).toBe('publicado');
    expect(resultado.id_usuariocreador).toBe(1);
    expect(resultado.video_url).toBe('https://video.com/pasta');
  });

  // ----- CP02: Negativo - título vacío ---------------------------------------------
  // Nota: el método no valida si el título es vacío, lo asigna directamente.
  // Esto revela que falta validación en setDatosBase para campos obligatorios.
  it('CP02 - debería asignar nombre vacío sin lanzar error si el título es string vacío', () => {
    // Arrange
    const dto: CrearRecetaDto = {
      titulo: '',
      descripcion: 'Rica',
      categoria: 'italiana',
      ingredientes: [],
      pasos: [],
    };

    // Act
    const resultado = builder.setDatosBase(dto).build();

    // Assert - documenta que no hay validación: nombre queda vacío sin error
    expect(resultado.nombre).toBe('');
  });

  // ----- CP03: Negativo - id_usuariocreador null ---------------------------------------------
  it('CP03 - no debería asignar id_usuariocreador si viene null, dejando la receta sin creador', () => {
    // Arrange
    const dto: CrearRecetaDto = {
      titulo: 'Pasta',
      descripcion: 'Rica',
      id_usuariocreador: undefined,
      categoria: 'italiana',
      ingredientes: [],
      pasos: [],
    };

    // Act
    const resultado = builder.setDatosBase(dto).build() as any;

    // Assert - el if(dto.id_usuariocreador) no se cumple, el campo no se asigna
    expect(resultado.id_usuariocreador).toBeUndefined();
  });

  // ----- CP04: Borde - título con caracteres especiales -------------------------
  it('CP04 - debería guardar caracteres especiales en el nombre sin modificarlos', () => {
    // Arrange
    const dto: CrearRecetaDto = {
      titulo: 'Ñoquis & Crème brûlée',
      descripcion: 'Rica',
      categoria: 'francesa',
      ingredientes: [],
      pasos: [],
    };

    // Act
    const resultado = builder.setDatosBase(dto).build();

    // Assert
    expect(resultado.nombre).toBe('Ñoquis & Crème brûlée');
  });

  // ----- CP05: Borde - imagen vacía/nula -----------------------------------
  it('CP05 - debería asignar todos los campos correctamente aunque no haya imagen en el DTO', () => {
    // Arrange
    const dto: CrearRecetaDto = {
      titulo: 'Pasta',
      descripcion: 'Rica',
      imagen: undefined, // sin imagen
      categoria: 'italiana',
      ingredientes: [],
      pasos: [],
    };

    // Act
    const resultado = builder.setDatosBase(dto).build() as any;

    // Assert - los demás campos se asignan con normalidad
    expect(resultado.nombre).toBe('Pasta');
    expect(resultado.descripcion).toBe('Rica');
    // imagen no es responsabilidad de setDatosBase, no aparece en recetaFinal
    expect((resultado as any).imagen).toBeUndefined();
  });

  // ----- CP06: Lógica de negocio - descripción vacía -----------------------------------
  it('CP06 - debería enviar los datos sin problema aunque la descripción esté vacía', () => {
    // Arrange
    const dto: CrearRecetaDto = {
      titulo: 'Pasta',
      descripcion: undefined as any, // descripción opcional según el DTO
      categoria: 'italiana',
      ingredientes: [],
      pasos: [],
    };

    // Act
    const resultado = builder.setDatosBase(dto).build();

    // Assert - descripción es opcional, no genera conflicto
    expect(resultado.nombre).toBe('Pasta');
    expect(resultado.descripcion).toBe('N/A');
    // los defaults de campos opcionales siguen aplicando
    expect(resultado.tiempopreparacion).toBe('N/A');
    expect(resultado.calorias).toBe('N/A');
    expect(resultado.estado).toBe('pendiente');
  });
});