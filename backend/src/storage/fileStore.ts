import { promises as fs } from 'fs';
import path from 'path';
import { FileRecord } from '../types';
import { config } from '../config';

export class FileStore {
  private records = new Map<string, FileRecord>();
  private loaded = false;

  async init(): Promise<void> {
    if (this.loaded) {
      return;
    }

    await this.ensureDirectories();
    await this.loadFromDisk();
    this.loaded = true;
  }

  getAll(): FileRecord[] {
    return Array.from(this.records.values());
  }

  getByToken(token: string): FileRecord | undefined {
    return Array.from(this.records.values()).find((record) => record.token === token);
  }

  getById(id: string): FileRecord | undefined {
    return this.records.get(id);
  }

  async upsert(record: FileRecord): Promise<void> {
    this.records.set(record.id, record);
    await this.persist();
  }

  async remove(id: string): Promise<void> {
    this.records.delete(id);
    await this.persist();
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(config.uploadDir, { recursive: true });
    const metadataDir = path.dirname(config.metadataFile);
    await fs.mkdir(metadataDir, { recursive: true });
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const raw = await fs.readFile(config.metadataFile, 'utf-8');
      const data: FileRecord[] = JSON.parse(raw);
      data.forEach((record) => this.records.set(record.id, record));
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.persist();
        return;
      }
      throw error;
    }
  }

  private async persist(): Promise<void> {
    const payload = JSON.stringify(this.getAll(), null, 2);
    await fs.writeFile(config.metadataFile, payload, 'utf-8');
  }
}

export const fileStore = new FileStore();
