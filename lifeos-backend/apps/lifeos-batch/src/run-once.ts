import { NestFactory } from '@nestjs/core';
import { BatchModule } from './batch.module';
import { BatchService } from './batch.service';

async function run() {
  const app = await NestFactory.createApplicationContext(BatchModule);
  try {
    await app.get(BatchService).batchDeliverReminders();
  } finally {
    await app.close();
  }
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
