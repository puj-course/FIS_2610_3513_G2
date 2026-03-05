import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class IngredientesService {

  constructor(private prisma: PrismaService) {}

  async autocomplete(query: string) {

    if (!query || query.length < 2) {
      return []
    }

    return this.prisma.ingrediente.findMany({
      where: {
        nombre: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        idingrediente: true,
        nombre: true
      },
      take: 10
    })
  }

}
