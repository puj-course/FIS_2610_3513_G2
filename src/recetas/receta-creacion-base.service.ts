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

    if (dto.imagen) {
      const buffer = Buffer.from(dto.imagen.split(",")[1], "base64");
      builder.setImage("", buffer);
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
