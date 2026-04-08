import { ModeracionRequestDto } from '../dto/moderacion-request.dto';

export abstract class ModeraciónHandler {
  private next: ModeraciónHandler | null = null;

  setNext(handler: ModeraciónHandler): ModeraciónHandler {
    this.next = handler;
    return handler;   // permite encadenar: a.setNext(b).setNext(c)
  }

  protected pasarAlSiguiente(request: ModeracionRequestDto): void {
    if (this.next) {
      this.next.handle(request);
    }
  }

  abstract handle(request: ModeracionRequestDto): Promise<void>;
}
