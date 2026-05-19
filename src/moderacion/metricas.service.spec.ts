// src/moderacion/metricas.service.spec.ts
import { MetricasService } from './metricas.service';

// Se mockea el módulo de métricas del middleware para controlarlo en los tests
jest.mock('./metricas.middleware', () => ({
  metricas: new Map([
    [
      '/recetas',
      {
        totalRequests: 10,
        totalLatencia: 2000,
        latenciaMin: 100,
        latenciaMax: 400,
        timestamps: [Date.now(), Date.now()],
      },
    ],
  ]),
}));

describe('MetricasService', () => {
  let service: MetricasService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      receta: { count: jest.fn() },
      calificacion: { count: jest.fn() },
    };
    service = new MetricasService(prisma);
  });

  // getTasaRechazo ------------------------------------------------
  // Calcula el porcentaje de recetas rechazadas sobre el total de publicadas + rechazadas.
  // Si no hay recetas retorna tasa 0 para evitar división por cero.

  describe('getTasaRechazo', () => {
    it('CP01 - calcula correctamente la tasa de rechazo cuando hay recetas', async () => {
      // Arrange - 10 recetas en total, 3 rechazadas → 30%
      prisma.receta.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3);

      // Act
      const result = await service.getTasaRechazo();

      // Assert
      expect(result.total).toBe(10);
      expect(result.rechazadas).toBe(3);
      expect(result.tasa_rechazo).toBe('30.0%');
      expect(result.umbral_ok).toBe(false); // 30% no es < 30
    });

    it('CP02 - retorna tasa 0 cuando no hay recetas (evita división por cero)', async () => {
      // Arrange
      prisma.receta.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      // Act
      const result = await service.getTasaRechazo();

      // Assert
      expect(result.tasa_rechazo).toBe('0.0%');
      expect(result.umbral_ok).toBe(true);
    });
  });

  // getThroughputCalificaciones ------------------------------------------------
  // Cuenta cuántas calificaciones se hicieron en la última hora.

  describe('getThroughputCalificaciones', () => {
    it('CP03 - retorna el conteo de calificaciones en la última hora', async () => {
      // Arrange
      prisma.calificacion.count.mockResolvedValue(42);

      // Act
      const result = await service.getThroughputCalificaciones();

      // Assert
      expect(result.calificaciones_por_hora).toBe(42);
    });
  });

  // getLatenciaYThroughput ------------------------------------------------
  // Lee el mapa de métricas del middleware y genera un reporte por endpoint.

  describe('getLatenciaYThroughput', () => {
    it('CP04 - genera reporte con latencia promedio y throughput por endpoint', () => {
      // Act
      const result = service.getLatenciaYThroughput();

      // Assert
      expect(result.total_endpoints_monitoreados).toBe(1);
      expect(result.reporte[0].endpoint).toBe('/recetas');
      expect(result.reporte[0].latencia_promedio_ms).toBe(200); // 2000 / 10
      expect(result.reporte[0].umbral_latencia_ok).toBe(true);  // 200 < 500
    });
  });
});