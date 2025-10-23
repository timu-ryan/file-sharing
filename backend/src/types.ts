export interface FileRecord {
  id: string;
  originalName: string;
  storedName: string;
  size: number;
  mimeType: string;
  uploadAt: number;
  lastAccessAt: number;
  downloadCount: number;
  token: string;
}
