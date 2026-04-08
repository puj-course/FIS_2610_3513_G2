import { IRecetaBuilder } from './IrecetaBuilder-interface';
import { CrearRecetaDto } from '../dto/crear-receta.dto';
import { Prisma } from '@prisma/client';

export class RecetaImagelessBuilder implements IRecetaBuilder {
  private recetaFinal: any = {};

  reset(): void {
    this.recetaFinal = {};
  }

    // Datos base que recibe del dto, con valores por defecto
    setDatosBase(dto: CrearRecetaDto): this {
    this.recetaFinal.nombre            = dto.titulo;
    this.recetaFinal.descripcion       = dto.descripcion;
    this.recetaFinal.tiempopreparacion = dto.tiempopreparacion || 'N/A';
    this.recetaFinal.calorias          = dto.calorias          || 'N/A';
    this.recetaFinal.estado            = dto.estado            || 'pendiente';
    this.recetaFinal.fechacreacion     = new Date();
    if (dto.id_usuariocreador) {
    this.recetaFinal.id_usuariocreador = dto.id_usuariocreador;
    }
    return this;
  }

    // Este es el builder de la receta sin imagen, entonces no se asigna ni URL ni buffer
  setImage(_url: string, _buffer: Buffer): this {
    return this;
  }

  // Relación con la categoría (solo el ID)
  setCategory(id: number): this {
    this.recetaFinal.recetacategoria = {
      create: { categoria_idcategoria: id },
    };
    return this;
  }

  // Relación con ingredientes ( resuelve el ID )
  setIngredients(ingredientes: { id: number; cantidad: string }[]): this {
    this.recetaFinal.recetaingrediente = {
      create: ingredientes.map(ing => ({
        ingrediente_idingrediente: ing.id,
        cantidadingrediente:       ing.cantidad,
      })),
    };
    return this;
  }

  setPasos(pasos: string[]): this {
    this.recetaFinal.paso = {
      create: pasos.map((descripcion, i) => ({
        descripcion,
        numeropaso: i + 1,
      })),
    };
    return this;
  }

  build(): Prisma.recetaCreateInput {
    return this.recetaFinal as Prisma.recetaCreateInput;
  }
}