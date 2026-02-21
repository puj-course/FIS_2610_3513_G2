import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPostgresAdapterConfig, PrismaPostgresAdapter } from '@prisma/adapter-ppg'

import { PrismaClient, Prisma } from '../../../../prisma/generated';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  public readonly client: PrismaClient;

  constructor() {
    const connectionString = `${process.env.DATABASE_URL}`
    const config: PrismaPostgresAdapterConfig = {
        connectionString: connectionString,
    };
    const adapter = new PrismaPostgresAdapter(config);
    const options: Prisma.PrismaClientOptions = {
        adapter: adapter,
        errorFormat: 'pretty',
    };
    this.client = new PrismaClient(options);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
