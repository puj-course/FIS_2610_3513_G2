import { PrismaService } from "./../../prisma/prisma.service";
import { CrearRecetaDto } from "./dto/crear-receta.dto";
import { RecetaBuilder } from "./builder/receta.builder";
import { RecetaImagelessBuilder } from "./builder/recetaImageless.builder";
import { v2 as cloudinary } from "cloudinary";

export abstract class RecetaCreacionBase {
  constructor(protected readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // ── Plantilla ──────────────────────────────────────────
  async ejecutar(dto: CrearRecetaDto) {
    const categoria    = await this.resolverCategoria(dto);
    const ingredientes = await this.resolverIngredientes(dto);
    const data         = await this.construirReceta(dto, categoria, ingredientes);
    const receta       = await this.guardarEnBD(data);
    await this.notificar(receta);
    return { message: "Receta procesada correctamente", receta };
  }

  // ── Pasos comunes ─────────────────────────────────────────────
  protected async resolverCategoria(dto: CrearRecetaDto) {
    return this.prisma.categoria.findFirst({
      where: { nombre: { equals: dto.categoria, mode: "insensitive" } },
    });
  }

  protected async resolverIngredientes(dto: CrearRecetaDto) {
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

    return ingredientesResueltos;
  }

  protected async construirReceta(
    dto: CrearRecetaDto,
    categoria: any,
    ingredientes: { id: number; cantidad: string }[]
  ) {
    const builder = dto.imagen
      ? new RecetaBuilder()
      : new RecetaImagelessBuilder();

    builder.setDatosBase(dto);

    // VALIDACIÓN PARA IMAGEN
    if (dto.imagen && dto.imagen.includes(',')) {
      const buffer = Buffer.from(dto.imagen.split(",")[1], "base64");
      
      try {
        const imageUrl = await new Promise<string>((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            { folder: "recetasya" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result!.secure_url);
            }
          );
          upload.end(buffer);
        });

        builder.setImage(imageUrl, buffer); 
      } catch (error) {
        console.error("Error subiendo imagen a Cloudinary:", error);
        builder.setImage("", buffer); 
      }
    }
    // VALIDACIÓN PARA VIDEO
    if (dto.video_url) {
      // Si es un base64 (trae la coma del data:video/...)
      if (dto.video_url.includes(',')) {
        const base64Data = dto.video_url.split(',')[1];
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64');
          const videoUrl = await new Promise<string>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'recetasya/pendientes', resource_type: 'video' },
              (error, result) => {
                if (error) reject(error);
                else resolve(result!.secure_url);
              }
            ).end(buffer);
          });
          builder.setVideo(videoUrl);
        }
      } else {
        // Si no tiene coma, asumimos que ya es una URL de video o un string plano
        builder.setVideo(dto.video_url);
      }
    }

    if (categoria) {
      builder.setCategory(categoria.idcategoria);
    }

    builder.setIngredients(ingredientes).setPasos(dto.pasos);

    return builder.build();
  }

  protected async guardarEnBD(data: any) {
    return this.prisma.receta.create({ data });
  }
  // paso abstracto ( se decide si aplicar o no la notif )
  protected abstract notificar(receta: any): Promise<void>;
}


