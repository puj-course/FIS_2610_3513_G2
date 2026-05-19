import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

// Carpeta donde pones las imágenes locales, ej: scripts/images/bandeja-paisa.jpg
const IMAGES_DIR = path.join('scripts', 'images')

function loadImageBytes(filename: string): Uint8Array<ArrayBuffer> | null {
  if (!filename) return null
  const filepath = path.join(IMAGES_DIR, filename)
  if (fs.existsSync(filepath)) {
    const buf = fs.readFileSync(filepath)
    const ab = new ArrayBuffer(buf.byteLength)
    new Uint8Array(ab).set(buf)
    return new Uint8Array(ab)
  }
  console.warn(`⚠️  Imagen no encontrada: ${filepath}`)
  return null
}

function generateSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

async function main() {
  console.log('🔌 Conectando a:', process.env.DATABASE_URL?.split('@')[1]) // no loguea credenciales

  const parser = fs
    .createReadStream('scripts/recipes.csv')
    .pipe(parse({
      columns: true,
      delimiter: ';',
      trim: true,
      skip_empty_lines: true,
    }))

  for await (const row of parser) {

    // ── Ingredientes: "nombre:cantidad, nombre:cantidad" ──
const ingredientesArray = (row['Ingredientes'] ?? '')
  .split(',')
  .filter(Boolean)
  .map((i: string) => {
    const [nombre, cantidad] = i.trim().split(':')
    return { nombre: nombre.trim(), cantidad: cantidad?.trim() ?? '1' }
  })

    // ── Categorías: "cat1, cat2" ──
const categoriasArray = (row['Categorias'] ?? '')
  .split(',')
  .map((c: string) => c.trim())
  .filter(Boolean)

    // ── Pasos: "paso1|paso2|paso3" ──
    const pasosArray = (row['Pasos'] ?? '')
  .split('|')
  .map((p: string) => p.trim())
  .filter(Boolean)

    // ── Imagen local (Bytes) ──
    const imagenBytes = loadImageBytes(row['ImagenArchivo'])

    // ── Slug: usa el del CSV o genera uno automático ──
    const slug = row['SlugUrl'] || generateSlug(row['Nombre'])

    await prisma.receta.create({
      data: {
        nombre:           row['Nombre'],
        descripcion:      row['Descripcion']  || null,
        calorias:         row['Calorias'],
        tiempopreparacion: row['Tiempo'],
        slugUrl:          slug,
        estado:           row['Estado']       || 'publicado',
        imagenreceta:     imagenBytes,          // Bytes desde archivo local
        image_url:        row['ImagenUrl']    || null,
        video_url:        row['VideoUrl']     || null,
        fechacreacion:    new Date(),

        // ── Pasos ──
        paso: {
          create: pasosArray.map((descripcion: string, index: number) => ({
            descripcion,
            numeropaso: index + 1,
          })),
        },

        // ── Ingredientes ──
        recetaingrediente: {
          create: ingredientesArray.map(({ nombre, cantidad }: { nombre: string; cantidad: string }) => ({
            cantidadingrediente: cantidad,
            ingrediente: {
              connectOrCreate: {
                where:  { nombre },
                create: { nombre },
              },
            },
          })),
        },

        // ── Categorías ──
        recetacategoria: {
          create: categoriasArray.map((nombre: string) => ({
            categoria: {
              connectOrCreate: {
                where:  { nombre },
                create: { nombre },
              },
            },
          })),
        },
      },
    })

    console.log(`✅ Receta insertada: ${row['Nombre']}`)
  }
}

main()
  .catch(e => console.error('❌ Error:', e))
  .finally(async () => {
    await prisma.$disconnect()
  })