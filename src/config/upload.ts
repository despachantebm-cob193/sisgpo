import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

const storage = multer.memoryStorage();

export default {
  directory: tmpFolder,
  storage,
};
