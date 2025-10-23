import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config';
import { fileStore } from '../storage/fileStore';
import { FileRecord } from '../types';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

const router = Router();

router.post('/files', upload.single('file'), async (req: Request, res: Response) => {
  if (config.apiKey && req.headers['x-api-key'] !== config.apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'File is required' });
  }

  const id = randomUUID();
  const token = randomUUID();
  const now = Date.now();

  const record: FileRecord = {
    id,
    token,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    size: req.file.size,
    mimeType: req.file.mimetype,
    uploadAt: now,
    lastAccessAt: now,
    downloadCount: 0,
  };

  await fileStore.upsert(record);

  const host = config.hostUrl ?? `${req.protocol}://${req.get('host')}`;
  const downloadUrl = `${host}/download/${token}`;

  return res.status(201).json({
    id,
    token,
    downloadUrl,
    expiresInDays: Math.round(config.retentionMs / (24 * 60 * 60 * 1000)),
    size: record.size,
    originalName: record.originalName,
  });
});

router.get('/files/:token/meta', (req: Request, res: Response) => {
  const record = fileStore.getByToken(req.params.token);
  if (!record) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.json({
    originalName: record.originalName,
    size: record.size,
    uploadAt: record.uploadAt,
    lastAccessAt: record.lastAccessAt,
    downloadCount: record.downloadCount,
    expiresAt: record.lastAccessAt + config.retentionMs,
  });
});

router.get('/stats', (_req: Request, res: Response) => {
  const records = fileStore.getAll();
  const totalFiles = records.length;
  const totalDownloads = records.reduce((sum, record) => sum + record.downloadCount, 0);
  const storageUsed = records.reduce((sum, record) => sum + record.size, 0);

  return res.json({
    totalFiles,
    totalDownloads,
    storageUsed,
    retentionDays: Math.round(config.retentionMs / (24 * 60 * 60 * 1000)),
  });
});

export default router;
