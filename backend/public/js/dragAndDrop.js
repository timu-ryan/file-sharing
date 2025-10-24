import { elements } from './dom.js';
import { setStatus } from './ui.js';

export function initDragAndDrop() {
  const { dropArea, fileInput } = elements;
  if (!dropArea || !fileInput) {
    return;
  }

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

  dropArea.addEventListener('click', () => {
    fileInput.click();
  });

  dropArea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInput.click();
    }
  });
}
