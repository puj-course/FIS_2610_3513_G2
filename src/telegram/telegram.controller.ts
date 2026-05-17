import { Controller, Post, Body, Logger } from "@nestjs/common";
import { TelegramService } from "./telegram.service";
import { NotificacionesFacade } from "./NotificacionesFacade";
import { UsuariosService } from "../usuarios/usuarios.service";
import { RecetasService } from "../recetas/recetas.service";

interface Sesion {
  idusuario: number;
  nickname: string;
}
// Controladores ------------------------------------------------
@Controller("telegram")
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);
  private readonly sesiones = new Map<number, Sesion>(); // NOTA: Este coso es para guardar las sesiones de los usuarios que inician sesión desde Telegram, se mapea chatId -> Sesion

  constructor(
    private readonly telegramService: TelegramService,
    private readonly notificaciones: NotificacionesFacade,
    private readonly usuariosService: UsuariosService,
    private readonly recetasService: RecetasService,
  ) {}

  // Post del webhook de Telegram
  @Post("webhook")
  async handleWebhook(@Body() update: any) {
    const message = update?.message;
    if (!message) return { ok: true };
    // Siempre recibe el chatId y el texto del mensaje, lo demás es opcional dependiendo del tipo de mensaje que se reciba
    const chatId = message.chat.id;
    const texto = message.text?.trim() || "";

    this.logger.log(`[Telegram] Mensaje de chatId=${chatId}: "${texto}"`);

    // Mensaje "/start" que ingresa la persona, se le da la bienvenida y los comandos disponibles
    if (texto === "/start") {
      await this.telegramService.enviarMensajeA(
        chatId,
        "Hola! 👋 Bienvenid@ a RecetaYa, este es el bot de telegram oficial, estos son los comandos que puedes usar:\n\n/login <email> <contraseña> ( Te da acceso a /misguardadas & /miscreadas )\n/misguardadas: Te permite consultar las recetas que tienes guardadas.\n/miscreadas: Te permite consultar las recetas que has creado.\n\n/logout: Cierre de sesión.",
      );

      // /login email contrasena
    } else if (texto.startsWith("/login")) {
      const partes = texto.split(" "); // parte 0 es el comando, parte 1 es el email, parte 2 es la contraseña
      if (partes.length < 3 || partes.length > 3) {
        await this.telegramService.enviarMensajeA(
          chatId,
          "!!! Uso correcto: /login email contraseña",
        );
        return { ok: true };
      }

      const email = partes[1];
      const contrasena = partes[2];

      try {
        const resultado = await this.usuariosService.login({
          email,
          contrasena,
        }); // Si no hay errores entonces se guarda la sesión del usuario loggeado en el mapa de sesiones, usa chatID como clave
        this.sesiones.set(chatId, {
          idusuario: resultado.user.idusuario,
          nickname: resultado.user.nickname,
        }); 
        await this.telegramService.enviarMensajeA(
          chatId,
          `✅ ${resultado.message}`,
        );
      } catch (err) {
        await this.telegramService.enviarMensajeA(
          chatId,
          `No se logró iniciar sesión. Verifica tus credenciales.`,
        );
      }

      // /misguardadas - muestra las recetas creadas por el usuario loggeado, si no hay sesión activa se le indica que primero debe hacer /login
    } else if (texto === "/misguardadas") {
      const sesion = this.sesiones.get(chatId);
      if (!sesion) {
        await this.telegramService.enviarMensajeA(
          chatId,
          "⚠️ Primero debes hacer /login",
        );
        return { ok: true };
      }

      const guardadas = await this.recetasService.getRecetasGuardadas(
        sesion.idusuario,
      );
      if (guardadas.length === 0) {
        await this.telegramService.enviarMensajeA(
          chatId,
          "📭 No tienes recetas guardadas aún.",
        );
      } else {
        const lista = guardadas
          .map((r, i) => `${i + 1}. Receta #${r.receta_idreceta}`)
          .join("\n");
        await this.telegramService.enviarMensajeA(
          chatId,
          `📋 Tus recetas guardadas:\n\n${lista}`,
        );
      }

      // /logout
    } else if (texto === "/logout") {
      this.sesiones.delete(chatId);
      await this.telegramService.enviarMensajeA(
        chatId,
        "👋 Sesión cerrada correctamente.",
      );
      // /misrecetas - muestra las recetas creadas por el usuario loggeado, si no hay sesión activa se le indica que primero debe hacer /login
    } else if (texto === "/miscreadas") {
      const sesion = this.sesiones.get(chatId);
      if (!sesion) {
        await this.telegramService.enviarMensajeA(
          chatId,
          "⚠️ Primero debes hacer /login",
        );
        return { ok: true };
      }

      const todasLasRecetas = await this.recetasService.getAll();
      const miscreadas = todasLasRecetas.recetas.filter(
        (r: any) => r.id_usuariocreador === sesion.idusuario,
      );

      if (miscreadas.length === 0) {
        await this.telegramService.enviarMensajeA(
          chatId,
          "📭 No tienes recetas creadas aún...",
        );
      } else {
        const lista = miscreadas
          .map(
            (r: any, i: number) =>
              `${i + 1}. ${r.nombre} — Estado: ${r.estado}`,
          )
          .join("\n");
        await this.telegramService.enviarMensajeA(
          chatId,
          `👨‍🍳 Tus recetas creadas:\n\n${lista}`,
        );
      }
    } else {
      await this.telegramService.enviarMensajeA(
        chatId,
        `No logré entender "${texto}". Prueba con /start`,
      );
    }

    return { ok: true };
  }
}
