import path from "path";

const retentionDays = Number(process.env.RETENTION_DAYS ?? 30);

export const config = {
  uploadDir: path.resolve(__dirname, '..', 'uploads'),
  metadataFile: path.resolve(__dirname, '..', 'data', 'files.json'),
  cleanupIntervalMs: 5 * 1000, // очистка каждый час
  retentionMs: retentionDays * 10 * 1000,
  hostUrl: process.env.HOST_URL,
  apiKey: process.env.API_KEY,
}
