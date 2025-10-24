import { elements } from './dom.js';
import { setStatus } from './ui.js';

export function initCopyLink() {
  const { copyLinkButton, downloadLinkEl } = elements;
  if (!copyLinkButton || !downloadLinkEl) {
    return;
  }

  copyLinkButton.addEventListener('click', async () => {
    const link = downloadLinkEl.href;
    if (!link || link === '#') {
      setStatus('Сначала загрузите файл, чтобы появилась ссылка.', true);
      return;
    }

    const notifySuccess = () => {
      setStatus('Ссылка скопирована в буфер обмена');
    };

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
        notifySuccess();
        return;
      }
    } catch (error) {
      console.warn('Clipboard API недоступен', error);
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);

      const selection = document.getSelection();
      const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (selectedRange && selection) {
        selection.removeAllRanges();
        selection.addRange(selectedRange);
      }

      if (successful) {
        notifySuccess();
        return;
      }

      throw new Error('Fallback copy failed');
    } catch (error) {
      console.error('Не удалось скопировать ссылку', error);
      setStatus('Не удалось скопировать ссылку. Скопируйте вручную.', true);
    }
  });
}
