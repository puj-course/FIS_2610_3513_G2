// Estado intrinseco. Estos datos no cmabian y se comparten por todos los ingredientes.
export class IngredienteFlyweight {
  constructor(
    public readonly idingrediente: number,
    public readonly nombre: string,
  ) {}
}
