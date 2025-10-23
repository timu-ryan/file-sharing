import express from "express";
import type { Request, Response } from "express";
import path from "path";
import { promises as fs } from "fs";

import { fileStore } from './storage/fileStore';
import { config } from './config';

const app = express();

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

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("Hello World!");
})

app.get("/download", (req: Request, res: Response) => {
  res.status(200).download('./src/server.ts');
})

async function start(){
  await fileStore.init()
  app.listen(3001, () => console.log("Server started on port 3001"));
}

const _ = start();
