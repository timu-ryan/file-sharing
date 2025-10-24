import express from "express";
import type { Request, Response } from "express";
import path from "path";
import { promises as fs } from "fs";

import fileRoutes from './routes/fileRoutes';
import { fileStore } from './storage/fileStore';
import { cleanupService } from './services/cleanupService';
import { config } from './config';

const app = express();

app.use(express.json());
app.use('/api', fileRoutes);

app.get('/get-all', async (req: Request, res: Response) => {
  const a = fileStore.getAll()
  return res.status(200).send(a)
})

app.get('/download/:token', async (req: Request, res: Response) => {
  const record = fileStore.getByToken(req.params.token);
  if (!record) {
    return res.status(404).send('File not found');
  }

  const filePath = path.join(config.uploadDir, record.storedName);

  try {
    await fs.access(filePath);
  } catch (error: unknown) {
    await fileStore.remove(record.id);
    return res.status(410).send('File is no longer available');
  }

  record.downloadCount += 1;
  record.lastAccessAt = Date.now();
  await fileStore.upsert(record);

  return res.download(filePath, record.originalName);
});

const staticDir = path.resolve(__dirname, '..', 'public');
app.use(express.static(staticDir));

const port = Number(process.env.PORT) || 3000;

async function start(): Promise<void> {
  await fileStore.init();
  await cleanupService.runCleanup();
  cleanupService.start();

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

const _ = start();
