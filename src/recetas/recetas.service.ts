import { Injectable } from "@nestjs/common";
import { NotificacionesFacade } from "./../telegram/NotificacionesFacade";
import { PrismaService } from "../../prisma/prisma.service";
import { CrearRecetaDto } from "./dto/crear-receta.dto";
import { CrearRecetaService } from "./crear-receta.service";
import { GuardarBorradorService } from "./guardar-borrador.service";
import { v2 as cloudinary } from "cloudinary";

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
    private readonly guardarBorradorService: GuardarBorradorService,
    private readonly notificaciones: NotificacionesFacade,
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
  if (estado === "aprobado") {


    const receta = await this.prisma.receta.findUnique({
      where: { idreceta },
    });

    await this.notificaciones.notificarTelegram(receta);

    if (!receta) {
      throw new Error("Receta no encontrada");
    }

    let imageUrl = receta.image_url;

    if (receta.imagenreceta && !receta.image_url) {
      imageUrl = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "recetasya" }, (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          })
          .end(receta.imagenreceta); // ✅ correcto
      });
    }

    return this.prisma.receta.update({
      where: { idreceta },
      data: {
        estado: "aprobado",
        image_url: imageUrl,
        imagenreceta: null, // ✅ correcto
      },
    });

  } else {

    const receta = await this.prisma.receta.findUnique({
      where: { idreceta },
    });

    await this.notificaciones.notificarTelegram(receta);
    return this.prisma.receta.update({
      where: { idreceta },
      data: { estado },
    });
  }
}

getAll() {
  return this.prisma.receta.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      recetaingrediente: { include: { ingrediente: true } },
      paso: { orderBy: { numeropaso: 'asc' } },
    },
  }).then(recetas => recetas.map(r => {
    console.log('tipo:', typeof r.imagenreceta, '| constructor:', r.imagenreceta?.constructor?.name);
    return {
      ...r,
      image_url: r.image_url
        ?? (r.imagenreceta
          ? `data:image/jpeg;base64,${Buffer.from(r.imagenreceta as Buffer).toString('base64')}`
          : null),
      imagenreceta: undefined,
    };
  }));
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


