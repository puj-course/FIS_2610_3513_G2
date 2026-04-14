import { CrearRecetaDto } from '../dto/crear-receta.dto';
import { Prisma } from '@prisma/client';
export interface IRecetaBuilder {
  reset(): void;
  setDatosBase(dto: CrearRecetaDto): this;
  setImage(url: string, buffer: Buffer): this;
  setCategory(id: number): this;
  setVideo(url: string): this;
  setIngredients(ingredientes: any[]): this;
  setPasos(pasos: string[]): this;
  build(): Prisma.recetaCreateInput;
}
