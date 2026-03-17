import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearRecetaDto } from './dto/crear-receta.dto';


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


    const receta = await this.prisma.receta.create({
      data: {
        nombre:            dto.titulo,
        descripcion:       dto.descripcion,
        tiempopreparacion: dto.tiempopreparacion || 'N/A',
        calorias:          dto.calorias          || 'N/A',
        imagenreceta:      imagenBuffer,
        estado:            dto.estado            || 'publicado',
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
    });
  }
}

