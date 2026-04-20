import { Injectable } from "@nestjs/common";
import { NotificacionesFacade } from "./../telegram/NotificacionesFacade";
import { PrismaService } from "../../prisma/prisma.service";
import { CrearRecetaDto } from "./dto/crear-receta.dto";
import { CrearRecetaService } from "./crear-receta.service";
import { GuardarBorradorService } from "./guardar-borrador.service";
import { v2 as cloudinary } from "cloudinary";
import { IngredienteFlyweightFactory } from '../ingredientes/flyweight/ingrediente-flyweight.factory';

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
    private readonly flyweightFactory: IngredienteFlyweightFactory,
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

    const imageUrl = await this.uploadImageCloudinary(idreceta);

    return this.prisma.receta.update({
      where: { idreceta },
      data: {
        estado: "aprobado",
        image_url: imageUrl,
        imagenreceta: null, 
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

async uploadImageCloudinary(idreceta: number) {

  const receta = await this.prisma.receta.findUnique({
    where: { idreceta },
  });

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
    return imageUrl;
  }
}

getAll() {
  return this.prisma.receta
    .findMany({
      orderBy: { nombre: 'asc' },
      include: {
        recetaingrediente: { include: { ingrediente: true } },
      },
    })
    .then(recetas => ({
      ingredientes: this.flyweightFactory.getPool(),
      recetas:      recetas.map(r => this.mapearReceta(r)),
    }));
}

private mapearReceta(r: any) {
  return {
    idreceta:          r.idreceta,
    nombre:            r.nombre,
    descripcion:       r.descripcion,
    estado:            r.estado,
    image_url:         this.resolverImagen(r),
    id_usuariocreador: r.id_usuariocreador,
    ingredienteIds:    this.resolverIngredientes(r),
  };
}

private resolverImagen(r: any): string | null {
  return r.image_url ?? (r.imagenreceta
    ? `data:image/jpeg;base64,${Buffer.from(r.imagenreceta).toString('base64')}`
    : null);
}

private resolverIngredientes(r: any): number[] {
  return r.recetaingrediente.map(ri => {
    this.flyweightFactory.getFlyweight(
      ri.ingrediente.idingrediente,
      ri.ingrediente.nombre,
    );
    return ri.ingrediente.idingrediente;
  });
}

  async eliminarReceta(idreceta: number) {
    await this.prisma.paso.deleteMany({ where: { receta_idreceta: idreceta } });
    await this.prisma.recetaingrediente.deleteMany({ where: { receta_idreceta: idreceta } });
    await this.prisma.recetacategoria.deleteMany({ where: { receta_idreceta: idreceta } });
  
    return this.prisma.receta.delete({
      where: { idreceta },
  });
  }

  async subirVideoCloudinary(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'recetasya/pendientes', resource_type: 'video' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      ).end(buffer);
    });
  }
}


