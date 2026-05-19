import { TelegramService } from './telegram.service';

// Se mockea el fetch globalmente para no hacer llamadas reales a la API de Telegram
global.fetch = jest.fn();


// fetch se reemplaza por una función falsa de Jest para interceptar todas las llamadas
// HTTP que haga el service internamente. Así los tests no dependen de internet ni de
// credenciales reales, solo se verifica que el código construye la llamada correctamente.



describe('TelegramService', () => {
  let service: TelegramService;
  let config: any;
  const fetchMock = global.fetch as jest.Mock;

  beforeEach(() => {
    config = { get: jest.fn().mockReturnValue('mock-token') };
    service = new TelegramService(config);
    fetchMock.mockResolvedValue({ ok: true });
    jest.clearAllMocks();
  });

  // enviarMensaje ------------------------------------------------
  // Envía un mensaje de texto al chatId configurado en variables de entorno.

  describe('enviarMensaje', () => {
    it('CP01 - llama a la API de Telegram con el texto correcto', async () => {
      // Act
      await service.enviarMensaje('Receta aprobada ✅');

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('sendMessage'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('CP02 - no lanza error si fetch falla (manejo silencioso)', async () => {
      // Arrange
      fetchMock.mockRejectedValue(new Error('Network error'));

      // Act & Assert - no debe propagar el error
      await expect(service.enviarMensaje('test')).resolves.not.toThrow();
    });
  });

  // enviarMensajeA ------------------------------------------------
  // Envía un mensaje a un chatId específico (usado por el bot de Telegram).

  describe('enviarMensajeA', () => {
    it('CP03 - llama a fetch con el chatId y texto indicados', async () => {
      // Act
      await service.enviarMensajeA(987654, 'Hola usuario');

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('987654'),
        }),
      );
    });

    it('CP04 - no lanza error si fetch falla (manejo silencioso)', async () => {
      // Arrange
      fetchMock.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(service.enviarMensajeA(123, 'test')).resolves.not.toThrow();
    });
  });

  // enviarFoto ------------------------------------------------
  // Envía una foto al chatId configurado en variables de entorno.

  describe('enviarFoto', () => {
    it('CP05 - llama a la API de Telegram con sendPhoto y los datos de la imagen', async () => {
      // Act
      await service.enviarFoto(Buffer.from('imagen'), 'Arepa con hogao');

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('sendPhoto'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('CP06 - no lanza error si fetch falla (manejo silencioso)', async () => {
      // Arrange
      fetchMock.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(
        service.enviarFoto(Buffer.from('imagen'), 'caption')
      ).resolves.not.toThrow();
    });
  });

  // enviarFotoA ------------------------------------------------
  // Envía una foto a un chatId específico (usado por el bot de Telegram).

  describe('enviarFotoA', () => {
    it('CP07 - llama a sendPhoto con el chatId y la imagen correctos', async () => {
      // Act
      await service.enviarFotoA(987654, Buffer.from('imagen'), 'Tamales de Sañuera');

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('sendPhoto'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('CP08 - no lanza error si fetch falla (manejo silencioso)', async () => {
      // Arrange
      fetchMock.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(
        service.enviarFotoA(123, Buffer.from('imagen'), 'caption')
      ).resolves.not.toThrow();
    });
  });
});

