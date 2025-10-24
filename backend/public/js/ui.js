import { elements } from './dom.js';

export function setStatus(message, isError = false) {
  const { statusEl } = elements;
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message;
  statusEl.hidden = false;
  statusEl.classList.toggle('error', Boolean(isError));
}

export function resetView() {
  const { statusEl, resultEl, progressContainer, progressBar } = elements;
  if (statusEl) {
    statusEl.hidden = true;
    statusEl.classList.remove('error');
  }
  if (resultEl) {
    resultEl.hidden = true;
  }
  if (progressContainer) {
    progressContainer.hidden = true;
  }
  if (progressBar) {
    progressBar.style.width = '0%';
  }
}

export function formatBytes(bytes) {
  if (bytes === 0) {
    return '0 Б';
  }
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${sizes[i]}`;
}

export function updateSelectedFileDisplay(file) {
  const { selectedFileEl } = elements;
  if (!selectedFileEl) {
    return;
  }
  if (file) {
    selectedFileEl.textContent = `${file.name} (${formatBytes(file.size)})`;
    selectedFileEl.hidden = false;
  } else {
    selectedFileEl.textContent = '';
    selectedFileEl.hidden = true;
  }
}
