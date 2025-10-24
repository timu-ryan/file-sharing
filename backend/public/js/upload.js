import { elements } from './dom.js';
import { refreshStats } from './stats.js';
import { resetView, setStatus, updateSelectedFileDisplay } from './ui.js';

export function initUpload() {
  const {
    form,
    fileInput,
    apiKeyInput,
    progressContainer,
    progressBar,
    downloadLinkEl,
    expiresEl,
    resultEl,
  } = elements;

  if (!form || !fileInput) {
    return;
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

    const apiKey = apiKeyInput?.value.trim();
    if (apiKey) {
      xhr.setRequestHeader('x-api-key', apiKey);
    }

    xhr.upload.onprogress = (progressEvent) => {
      if (!progressEvent.lengthComputable) {
        return;
      }
      const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
      if (progressContainer) {
        progressContainer.hidden = false;
      }
      if (progressBar) {
        progressBar.style.width = `${percent}%`;
      }
      setStatus(`Загрузка: ${percent}%`);
    };

    xhr.onload = () => {
      if (progressBar) {
        progressBar.style.width = '0%';
      }
      if (progressContainer) {
        progressContainer.hidden = true;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setStatus('Файл успешно загружен');
          if (downloadLinkEl) {
            downloadLinkEl.href = data.downloadUrl;
            downloadLinkEl.textContent = data.downloadUrl;
          }
          if (expiresEl) {
            expiresEl.textContent = `Ссылка останется активной, пока файл скачивается хотя бы раз в ${data.expiresInDays} дней.`;
          }
          if (resultEl) {
            resultEl.hidden = false;
          }
          form.reset();
          updateSelectedFileDisplay(null);
          void refreshStats();
        } catch (error) {
          console.error('Failed to parse response', error);
          setStatus('Не удалось обработать ответ сервера', true);
        }
        return;
      }

      let message = 'Ошибка загрузки файла';
      try {
        const errorData = JSON.parse(xhr.responseText);
        if (errorData.error) {
          message = errorData.error;
        }
      } catch (error) {
        console.error('Failed to parse error response', error);
      }
      setStatus(message, true);
    };

    xhr.onerror = () => {
      setStatus('Ошибка соединения. Проверьте подключение к интернету.', true);
      if (progressBar) {
        progressBar.style.width = '0%';
      }
      if (progressContainer) {
        progressContainer.hidden = true;
      }
    };

    resetView();
    setStatus('Начинаем загрузку...');
    xhr.send(formData);
  });
}
