import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearRecetaDto } from './dto/crear-receta.dto';
import { TelegramService } from '../telegram/telegram.service'; // para las llamadas al telegra 
import { v2 as cloudinary } from 'cloudinary'; // para url de imagenes en cloudinary 



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
  ) {}

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

//----------------------------------------------------------------------------------------------------------
async crearReceta(dto: CrearRecetaDto) {


    const categoria = await this.prisma.categoria.findFirst({
      where: { nombre: { equals: dto.categoria, mode: 'insensitive' } },
    });


    const ingredientesResueltos: { id: number; cantidad: string }[] = [];
    for (const ing of dto.ingredientes) {
      let ingrediente = await this.prisma.ingrediente.findFirst({
        where: { nombre: { equals: ing.nombre, mode: 'insensitive' } },
      });
      if (!ingrediente) {
        ingrediente = await this.prisma.ingrediente.create({
          data: { nombre: ing.nombre },
        });
      }
      ingredientesResueltos.push({
        id: ingrediente.idingrediente,
        cantidad: [ing.cantidad, ing.unidad].filter(Boolean).join(' '),
      });
    }

 
    const imagenBuffer = dto.imagen
      ? Buffer.from(dto.imagen.split(',')[1], 'base64')
      : null;

    let image_url: string | null = null;
    if (imagenBuffer) {
      image_url = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'recetasya' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        ).end(imagenBuffer);
      });
    }


    const receta = await this.prisma.receta.create({
      data: {
        nombre:            dto.titulo,
        descripcion:       dto.descripcion,
        image_url:         image_url,
        tiempopreparacion: dto.tiempopreparacion || 'N/A',
        calorias:          dto.calorias          || 'N/A',
        imagenreceta:      imagenBuffer,
        estado:            dto.estado            || 'pendiente',
        fechacreacion:     new Date(),

        paso: {
          create: dto.pasos.map((descripcion, i) => ({
            descripcion,
            numeropaso: i + 1,
          })),
        },

        ...(categoria && {
          recetacategoria: {
            create: { categoria_idcategoria: categoria.idcategoria },
          },
        }),

        recetaingrediente: {
          create: ingredientesResueltos.map(ing => ({
            ingrediente_idingrediente: ing.id,
            cantidadingrediente:       ing.cantidad,
          })),
        },
      },
    });


    if (dto.estado === 'pendiente') {
    const caption =
    `📋 Nueva receta para verificar\n\n` +
    `🍽️ Nombre: ${receta.nombre}\n` +
    `📝 Descripción: ${receta.descripcion || 'Sin descripción'}\n` +
    `🆔 ID: ${receta.idreceta}\n\n` +
    `Estado: ⏳ Pendiente de revisión`;

  if (imagenBuffer) {
    // Si tiene imagen, enviar foto con el caption
    await this.telegram.enviarFoto(imagenBuffer, caption);
  } else {
    // Si no tiene imagen, enviar solo texto
    await this.telegram.enviarMensaje(caption);
  }
}

    return { message: 'La receta fue creada waow...', receta };
  }

  // Guardar borrador (crea la receta con estado 'borrador')
  async guardarBorrador(dto: CrearRecetaDto) {
    return this.crearReceta({ ...dto, estado: 'borrador' });
  }

  // Actualizaestado de una receta existente
  async actualizarEstado(idreceta: number, estado: string) {
    return this.prisma.receta.update({
      where: { idreceta },
      data: { estado },
    });
  }


getAll() {
  return this.prisma.receta.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      recetaingrediente: {
        include: { ingrediente: true },
      },
    },
  }).then(recetas => recetas.map(r => ({
    ...r,
    image_url: r.image_url ?? (
      r.imagenreceta
        ? `data:image/jpeg;base64,${Buffer.from(r.imagenreceta).toString('base64')}`
        : null
    ),
    imagenreceta: undefined, // no enviar el buffer crudo al frontend
  })));
}
}

