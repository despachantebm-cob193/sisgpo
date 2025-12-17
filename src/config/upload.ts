import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

const storage = multer.diskStorage({
  destination: tmpFolder,
  filename: (_request, file, callback) => {
    const fileHash = crypto.randomBytes(10).toString('hex');
    const fileName = `${fileHash}-${file.originalname}`;
    callback(null, fileName);
  },
});

export default {
  directory: tmpFolder,
  storage,
};
