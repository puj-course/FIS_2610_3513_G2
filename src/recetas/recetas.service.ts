import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CrearRecetaDto } from "./dto/crear-receta.dto";
import { TelegramService } from "../telegram/telegram.service"; // para las llamadas al telegra
import { v2 as cloudinary } from "cloudinary"; // para url de imagenes en cloudinary
import { RecetaBuilder } from "./builder/receta.builder";
import { RecetaImagelessBuilder } from "./builder/recetaImageless.builder";

// Tipo para el resultado con score
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
    private readonly telegram: TelegramService
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
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

    // Prisma devuelve COUNT como BigInt, hay que convertirlo
    return recetas.map((r) => ({
      ...r,
      score: Number(r.score),
    }));
  }

  //----------------------------------------------------------------------------------------------------------
  async crearReceta(dto: CrearRecetaDto) {
    // Resolver categoría e ingredientes, no es nada complejo asi que se deja aquí.
    const categoria = await this.prisma.categoria.findFirst({
      where: { nombre: { equals: dto.categoria, mode: "insensitive" } },
    });

    // Resolver ingredientes, si no existen se crean en la BD.
    const ingredientesResueltos: { id: number; cantidad: string }[] = [];
    for (const ing of dto.ingredientes) {
      let ingrediente = await this.prisma.ingrediente.findFirst({
        where: { nombre: { equals: ing.nombre, mode: "insensitive" } },
      });
      if (!ingrediente) {
        ingrediente = await this.prisma.ingrediente.create({
          data: { nombre: ing.nombre },
        });
      }
      ingredientesResueltos.push({
        id: ingrediente.idingrediente,
        cantidad: [ing.cantidad, ing.unidad].filter(Boolean).join(" "),
      });
    }

    // Decide que builder usar según si hay imagen o no
    const builder = dto.imagen
      ? new RecetaBuilder()
      : new RecetaImagelessBuilder();

    builder.setDatosBase(dto);

    if (dto.imagen) {
      const { buffer, url } = await this.subirImagen(dto.imagen);
      builder.setImage(url, buffer);
    }

    if (categoria) {
      builder.setCategory(categoria.idcategoria);
    }

    builder.setIngredients(ingredientesResueltos).setPasos(dto.pasos);

    const data = builder.build();
    const receta = await this.prisma.receta.create({ data });

    if (dto.estado === "pendiente") {
      await this.notificarTelegram(receta, (data as any).imagenreceta); // ← aquí
    }

    return { message: "La receta fue creada waow...", receta };
  }

  // Guardar borrador (crea la receta con estado 'borrador')
  async guardarBorrador(dto: CrearRecetaDto) {
    return this.crearReceta({ ...dto, estado: "borrador" });
  }

  //----------------------------------------------------------------------------
  // Metodo privado para subir imagen y la conversión a buffer, separada de crearReceta para levantar cohesión
  private async subirImagen(
    imagenBase64: string
  ): Promise<{ buffer: Buffer; url: string }> {
    const buffer = Buffer.from(imagenBase64.split(",")[1], "base64");

    const url = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "recetasya" }, (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        })
        .end(buffer);
    });

    return { buffer, url };
  }

  // Metodo privado para notificar a telegram sobre la nueva receta, separado de crearReceta para levantar cohesión
  private async notificarTelegram(
    receta: any,
    imagenBuffer?: Buffer
  ): Promise<void> {
    const caption =
      `📋 Nueva receta para verificar\n\n` +
      `🍽️ Nombre: ${receta.nombre}\n` +
      `📝 Descripción: ${receta.descripcion || "Sin descripción"}\n` +
      `🆔 ID: ${receta.idreceta}\n\n` +
      `Estado: ⏳ Pendiente de revisión`;

    if (imagenBuffer) {
      await this.telegram.enviarFoto(imagenBuffer, caption);
    } else {
      await this.telegram.enviarMensaje(caption);
    }
  }
  //----------------------------------------------------------------------------

  // Actualizaestado de una receta existente
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
              ? `data:image/jpeg;base64,${Buffer.from(r.imagenreceta).toString(
                  "base64"
                )}`
              : null),
          imagenreceta: undefined, // no enviar el buffer crudo al frontend
        }))
      );
  }
}
