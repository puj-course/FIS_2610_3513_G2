export class ModeracionRequestDto {
  usuarioId: number;
  recetaId: number;
  accion: 'aprobar' | 'rechazar' | 'eliminar';
}
