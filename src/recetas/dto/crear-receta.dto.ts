import { IsOptional, IsUrl } from 'class-validator';
export class IngredienteDto {
  nombre: string;
  cantidad: string;
  unidad: string;
}

export class CrearRecetaDto {
  titulo: string;
  descripcion: string;
  categoria: string;
  tiempopreparacion?: string;
  calorias?: string;
  imagen?: string;            // base64
  ingredientes: IngredienteDto[];
  image_url?: string;
  pasos: string[];
  estado?: string;            // borrardor o publicado 
  id_usuariocreador?: number;
  }
