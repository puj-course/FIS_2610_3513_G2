import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import fs from 'fs'
import { parse } from 'csv-parse'
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});


const prisma = new PrismaClient({ adapter });

async function main() {

console.log(process.env.DATABASE_URL)


  const parser = fs
    .createReadStream('Scripts/recipes.csv')
    .pipe(parse({
      columns: true,
      delimiter: ';',
      trim: true
    }))

  for await (const row of parser) {

    const ingredientesArray = row["Ingredientes"]
      .split(',')
      .map((i: string) => i.trim())

    const categoriasArray = row["Categorias"]
      .split(',')
      .map((c: string) => c.trim())

    await prisma.receta.create({
      data: {
        nombre: row["Nombre"],
        calorias: row["Calorias"],
        tiempopreparacion: row["Tiempo"],
        fechacreacion: new Date(),

        recetaingrediente: {
          create: ingredientesArray.map((ingredienteNombre: string) => ({
            cantidadingrediente: "1", // puedes cambiar esto luego
            ingrediente: {
              connectOrCreate: {
                where: { nombre: ingredienteNombre },
                create: { nombre: ingredienteNombre }
              }
            }
          }))
        },

        // 🔹 Relación con categorías
        recetacategoria: {
          create: categoriasArray.map((categoriaNombre: string) => ({
            categoria: {
              connectOrCreate: {
                where: { nombre: categoriaNombre },
                create: { nombre: categoriaNombre }
              }
            }
          }))
        }

      }
    })

    console.log(`Receta insertada: ${row["Nombre"]}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
