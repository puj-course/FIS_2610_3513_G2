import { Injectable } from '@nestjs/common';
import { metricas } from './metricas.middleware';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MetricasService {
  constructor(private prisma: PrismaService) {}

  async getTasaRechazo() {
    const total = await this.prisma.receta.count({
      where: { estado: { in: ['publicado', 'rechazado'] } }
    });
    const rechazadas = await this.prisma.receta.count({
      where: { estado: 'rechazado' }
    });
    const tasa = total > 0 ? (rechazadas / total) * 100 : 0;
    return {
      total,
      rechazadas,
      tasa_rechazo: `${tasa.toFixed(1)}%`,
      umbral_ok: tasa < 30,
    };
  }

  async getThroughputCalificaciones() {
    const hace1hora = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.calificacion.count({
      where: { fecha: { gte: hace1hora } }
    });
    return { calificaciones_por_hora: count };
  }

  getLatenciaYThroughput() {
    const reporte: {
      endpoint: string;
      total_requests: number;
      latencia_promedio_ms: number;
      latencia_min_ms: number;
      latencia_max_ms: number;
      throughput_rpm: number;
      umbral_latencia_ok: boolean;
    }[] = [];

    for (const [endpoint, datos] of metricas.entries()) {
      const latenciaPromedio = datos.totalRequests > 0
        ? (datos.totalLatencia / datos.totalRequests).toFixed(2)
        : 0;

      reporte.push({
        endpoint,
        total_requests: datos.totalRequests,
        latencia_promedio_ms: Number(latenciaPromedio),
        latencia_min_ms: datos.latenciaMin === Infinity ? 0 : datos.latenciaMin,
        latencia_max_ms: datos.latenciaMax,
        throughput_rpm: datos.timestamps.length, // requests en el último minuto
        umbral_latencia_ok: Number(latenciaPromedio) < 500,
      });
    }

    return {
      total_endpoints_monitoreados: reporte.length,
      reporte,
    };
  }
}
