export interface IUsuarioCreado {
  idusuario: number;
  nickname: string;
  email: string;
  rol: string;
}

export interface DatosCreacion {
  nickname: string;
  email: string;
  contrasena: string;
  fecha_registro: Date;
  rol: string;
}