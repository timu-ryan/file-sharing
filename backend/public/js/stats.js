import { elements } from './dom.js';
import { formatBytes } from './ui.js';

export async function refreshStats() {
  const { statsSection, statsFiles, statsDownloads, statsStorage } = elements;
  if (!statsFiles || !statsDownloads || !statsStorage) {
    return;
  }

  try {
    const response = await fetch('/api/stats');
    if (!response.ok) {
      throw new Error('Failed to load stats');
    }
    const data = await response.json();
    statsFiles.textContent = data.totalFiles;
    statsDownloads.textContent = data.totalDownloads;
    statsStorage.textContent = formatBytes(data.storageUsed);
    if (statsSection) {
      statsSection.hidden = false;
    }
  } catch (error) {
    console.warn('Не удалось загрузить статистику', error);
    if (statsSection) {
      statsSection.hidden = true;
    }
  }
}
