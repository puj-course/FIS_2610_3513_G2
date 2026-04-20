import { Injectable } from '@nestjs/common';
import { IngredienteFlyweight } from './ingrediente.flyweight';

@Injectable()
export class IngredienteFlyweightFactory {

  private pool: Map<number, IngredienteFlyweight> = new Map();
  // se crea el pool compartido de cada ingrediente diferente que existe una sola vez

  // Devuelve el flyweight existente o crea uno nuevo
  getFlyweight(id:number, nombre:string): IngredienteFlyweight {
    if (!this.pool.has(id)) {
      this.pool.set(id, new IngredienteFlyweight(id, nombre));
    }
    return this.pool.get(id)!;
  }

  // record es un tipo generico que permite definir un objeto donde k es el tipo de clave v es los valores
  getPool(): Record<number, {idingrediente: number; nombre: string}> {
    const result: Record<number, {idingrediente: number; nombre: string}> = {};
    this.pool.forEach((flyweight, id) => {
      result[id] = {
        idingrediente: flyweight.idingrediente,
        nombre: flyweight.nombre,
      };
    });
    return result;
  }

  // devuelve el tamaño del pool
  getSize() : number {
    return this.pool.size;
  }
}
