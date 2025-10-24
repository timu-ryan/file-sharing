import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config';
import { fileStore } from '../storage/fileStore';

export class CleanupService {
  private timer: NodeJS.Timeout | null = null;

  start(): void {
    if (this.timer) {
      return;
    }
    void this.runCleanup();
    this.timer = setInterval(() => {
      void this.runCleanup();
    }, config.cleanupIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runCleanup(): Promise<void> {
    const now = Date.now();
    const records = fileStore.getAll();

    for (const record of records) {
      const lastAccess = record.lastAccessAt ?? record.uploadAt;
      if (now - lastAccess > config.retentionMs) {
        await this.deleteFile(record.id, record.storedName);
      }
    }
  }

  private async deleteFile(id: string, storedName: string): Promise<void> {
    const filePath = path.join(config.uploadDir, storedName);
    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to delete file', filePath, error);
      }
    }
    await fileStore.remove(id);
  }
}

export const cleanupService = new CleanupService();
