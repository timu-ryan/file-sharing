const form = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const apiKeyInput = document.getElementById('api-key');
const statusEl = document.getElementById('status');
const progressContainer = document.querySelector('.progress');
const progressBar = document.getElementById('progress-bar');
const resultEl = document.getElementById('result');
const downloadLinkEl = document.getElementById('download-link');
const expiresEl = document.getElementById('expires');
const statsSection = document.getElementById('stats');
const statsFiles = document.getElementById('stats-files');
const statsDownloads = document.getElementById('stats-downloads');
const statsStorage = document.getElementById('stats-storage');
const dropArea = document.getElementById('drop-area');
const selectedFileEl = document.getElementById('selected-file');

if (dropArea) {
  ['dragover', 'drop'].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      event.preventDefault();
    });
  });

  const preventDefaults = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  dropArea.addEventListener('dragenter', (event) => {
    preventDefaults(event);
    dropArea.classList.add('dragover');
  });

  dropArea.addEventListener('dragover', (event) => {
    preventDefaults(event);
    dropArea.classList.add('dragover');
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  });

  dropArea.addEventListener('dragleave', (event) => {
    preventDefaults(event);
    if (!dropArea.contains(event.relatedTarget)) {
      dropArea.classList.remove('dragover');
    }
  });

  dropArea.addEventListener('dragend', () => {
    dropArea.classList.remove('dragover');
  });

  dropArea.addEventListener('drop', (event) => {
    preventDefaults(event);
    dropArea.classList.remove('dragover');
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }
    const fileList = Array.from(files).slice(0, 1);
    try {
      if (typeof DataTransfer !== 'undefined') {
        const transfer = new DataTransfer();
        fileList.forEach((file) => {
          transfer.items.add(file);
        });
        fileInput.files = transfer.files;
      } else {
        fileInput.files = files;
      }
    } catch (error) {
      console.warn('Не удалось обработать перетаскивание файла', error);
      setStatus('Не удалось обработать файл. Выберите его вручную.', true);
      return;
    }
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  });

  dropArea.addEventListener('dblclick', () => {
    fileInput.click();
  });

  dropArea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInput.click();
    }
  });
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.hidden = false;
  statusEl.classList.toggle('error', Boolean(isError));
}

function resetView() {
  statusEl.hidden = true;
  resultEl.hidden = true;
  progressContainer.hidden = true;
  progressBar.style.width = '0%';
}

function formatBytes(bytes) {
  if (bytes === 0) {
    return '0 Б';
  }
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${sizes[i]}`;
}

function updateSelectedFileDisplay(file) {
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

async function refreshStats() {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) {
      throw new Error('Failed to load stats');
    }
    const data = await response.json();
    statsFiles.textContent = data.totalFiles;
    statsDownloads.textContent = data.totalDownloads;
    statsStorage.textContent = formatBytes(data.storageUsed);
    statsSection.hidden = false;
  } catch (error) {
    console.warn('Не удалось загрузить статистику', error);
    statsSection.hidden = true;
  }
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0] ?? null;
  updateSelectedFileDisplay(file);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const file = fileInput.files?.[0];

  if (!file) {
    setStatus('Выберите файл для загрузки', true);
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/files', true);

  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    xhr.setRequestHeader('x-api-key', apiKey);
  }

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      progressContainer.hidden = false;
      progressBar.style.width = `${percent}%`;
      setStatus(`Загрузка: ${percent}%`);
    }
  };

  xhr.onload = () => {
    progressBar.style.width = '0%';
    progressContainer.hidden = true;

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText);
        setStatus('Файл успешно загружен');
        downloadLinkEl.href = data.downloadUrl;
        downloadLinkEl.textContent = data.downloadUrl;
        expiresEl.textContent = `Ссылка останется активной, пока файл скачивается хотя бы раз в ${data.expiresInDays} дней.`;
        resultEl.hidden = false;
        form.reset();
        updateSelectedFileDisplay(null);
        void refreshStats();
      } catch (error) {
        console.error('Failed to parse response', error);
        setStatus('Не удалось обработать ответ сервера', true);
      }
    } else {
      let message = 'Ошибка загрузки файла';
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.error) {
          message = data.error;
        }
      } catch (error) {
        console.error('Failed to parse error response', error);
      }
      setStatus(message, true);
    }
  };

  xhr.onerror = () => {
    setStatus('Ошибка соединения. Проверьте подключение к интернету.', true);
    progressBar.style.width = '0%';
    progressContainer.hidden = true;
  };

  resetView();
  setStatus('Начинаем загрузку...');
  xhr.send(formData);
});

void refreshStats();
