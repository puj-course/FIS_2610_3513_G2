import { IsOptional, IsString } from 'class-validator'

export class SearchIngredienteDto {

  @IsOptional()
  @IsString()
  q?: string

}
