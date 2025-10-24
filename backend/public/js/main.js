import { initDragAndDrop } from './dragAndDrop.js';
import { initCopyLink } from './copy.js';
import { refreshStats } from './stats.js';
import { initUpload } from './upload.js';

initDragAndDrop();
initUpload();
initCopyLink();
void refreshStats();
