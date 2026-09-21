const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

const deleteFile = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOADS_DIR, filename);

    if (filePath.startsWith(UPLOADS_DIR)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to delete file for url ${imageUrl}:`, error.message);
    }
  }
};

module.exports = {
  deleteFile,
  UPLOADS_DIR,
};
