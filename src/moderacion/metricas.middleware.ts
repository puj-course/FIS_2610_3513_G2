import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface DatosEndpoint {
  totalRequests: number;
  totalLatencia: number;
  latenciaMin: number;
  latenciaMax: number;
  timestamps: number[]; // para calcular throughput
}

export const metricas = new Map<string, DatosEndpoint>();

@Injectable()
export class MetricasMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const inicio = Date.now();

    res.on('finish', () => {
      const latencia = Date.now() - inicio;

      const ahora = Date.now();

      const clave = `${req.method} ${req.route?.path ?? req.path}`;
      if (!metricas.has(clave)) {
        metricas.set(clave, {
          totalRequests: 0,
          totalLatencia: 0,
          latenciaMin: Infinity,
          latenciaMax: 0,
          timestamps: [],
        });
      }

      const dato = metricas.get(clave)!;
      dato.totalRequests++;
      dato.totalLatencia += latencia;
      dato.latenciaMin = Math.min(dato.latenciaMin, latencia);
      dato.latenciaMax = Math.max(dato.latenciaMax, latencia);

      // solo guarda timestamps del ultimo minuto
      dato.timestamps.push(ahora);
      dato.timestamps = dato.timestamps.filter(t => ahora - t < 60_000);
    });

    next();
  }
}
