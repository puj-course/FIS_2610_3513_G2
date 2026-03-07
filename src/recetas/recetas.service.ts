import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Tipo para el resultado con score
interface RecetaConScore {
  id: number;
  nombre: string;
  score: bigint;
  relevancia: number;
}

@Injectable()
export class RecetasService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorIngredientes(ingredientesIds: number[]) {
    const recetas = await this.prisma.$queryRaw<RecetaConScore[]>`
      SELECT 
        r.*,
        COUNT(ri.ingrediente_idingrediente) AS score,
        COUNT(ri.ingrediente_idingrediente)::float / ${ingredientesIds.length} AS relevancia
      FROM receta r
      JOIN recetaingrediente ri ON ri.receta_idreceta = r.idreceta
      WHERE ri.ingrediente_idingrediente = ANY(${ingredientesIds})
      GROUP BY r.idreceta
      ORDER BY score DESC
    `;

    // Prisma devuelve COUNT como BigInt, hay que convertirlo
    return recetas.map(r => ({
      ...r,
      score: Number(r.score),
    }));
  }
}