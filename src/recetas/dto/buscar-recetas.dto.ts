import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Transform } from 'class-transformer';

export class BuscarRecetasDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Transform(({ value }) => 
    Array.isArray(value) ? value.map(Number) : [Number(value)]
  )
  ingredientesIds: number[];
}