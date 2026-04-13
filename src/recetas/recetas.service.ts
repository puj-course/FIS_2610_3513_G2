import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CrearRecetaDto } from "./dto/crear-receta.dto";
import { CrearRecetaService } from "./crear-receta.service";
import { GuardarBorradorService } from "./guardar-borrador.service";

interface RecetaConScore {
  id: number;
  nombre: string;
  score: bigint;
  relevancia: number;
}

@Injectable()
export class RecetasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crearRecetaService: CrearRecetaService,
    private readonly guardarBorradorService: GuardarBorradorService
  ) {}

  crearReceta(dto: CrearRecetaDto) {
    return this.crearRecetaService.ejecutar(dto);
  }

  guardarBorrador(dto: CrearRecetaDto) {
    return this.guardarBorradorService.ejecutar(dto);
  }

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

    return recetas.map((r) => ({
      ...r,
      score: Number(r.score),
    }));
  }

  async actualizarEstado(idreceta: number, estado: string) {
    return this.prisma.receta.update({
      where: { idreceta },
      data: { estado },
    });
  }

  getAll() {
    return this.prisma.receta
      .findMany({
        orderBy: { nombre: "asc" },
        include: {
          recetaingrediente: {
            include: { ingrediente: true },
          },
        },
      })
      .then((recetas) =>
        recetas.map((r) => ({
          ...r,
          image_url:
            r.image_url ??
            (r.imagenreceta
              ? `data:image/jpeg;base64,${Buffer.from(r.imagenreceta).toString("base64")}`
              : null),
          imagenreceta: undefined,
        }))
      );
  }

  async eliminarReceta(idreceta: number) {
    await this.prisma.paso.deleteMany({ where: { receta_idreceta: idreceta } });
    await this.prisma.recetaingrediente.deleteMany({ where: { receta_idreceta: idreceta } });
    await this.prisma.recetacategoria.deleteMany({ where: { receta_idreceta: idreceta } });
  
    return this.prisma.receta.delete({
      where: { idreceta },
  });
  }
}


