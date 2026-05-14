import { IRecetaBuilder } from './IrecetaBuilder-interface';
import { CrearRecetaDto } from '../dto/crear-receta.dto';
import { Prisma } from '@prisma/client';

export class RecetaBuilder implements IRecetaBuilder {
  private recetaFinal: any = {};

  reset(): void {
    this.recetaFinal = {};
  }

    // Datos base que recibe del dto, con valores por defecto
    setDatosBase(dto: CrearRecetaDto): this {
    this.recetaFinal.nombre            = dto.titulo;
    this.recetaFinal.descripcion = dto.descripcion ?? 'N/A'; 
    this.recetaFinal.tiempopreparacion = dto.tiempopreparacion || 'N/A';
    this.recetaFinal.calorias          = dto.calorias          || 'N/A';
    this.recetaFinal.estado            = dto.estado            || 'pendiente';
    this.recetaFinal.fechacreacion     = new Date();
    if (dto.id_usuariocreador) {
  this.recetaFinal.id_usuariocreador = dto.id_usuariocreador;
  this.recetaFinal.usuario = {
    connect: { idusuario: dto.id_usuariocreador }
  };
}
    this.recetaFinal.video_url = dto.video_url || null;
    return this;
  }

setSlug(dto: CrearRecetaDto): this {
  const slugBase = dto.titulo.toLowerCase().trim();
  const slug = slugBase
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-/, '')  
    .replace(/-$/, '');   // FIX SONAR: separado para evitar posible backracking ( Ataque DoS regex )

  this.recetaFinal.slugUrl = slug;
  return this;
}


  // ( Recordar que este es el builder de la receta completa, contiene imagen )
  // Buffer de la imagen adjunta
  setImage(url: string, buffer: Buffer): this {
  this.recetaFinal.image_url     = url;
  this.recetaFinal.imagenreceta  = buffer;
  return this;
}

// set video
  setVideo(url: string): this {
    this.recetaFinal.video_url = url;
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
