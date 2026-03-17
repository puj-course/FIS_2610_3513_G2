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
  pasos: string[];
  estado?: string;            // borrardor o publicado 
}