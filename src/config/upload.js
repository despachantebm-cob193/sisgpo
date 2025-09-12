// Arquivo: backend/src/config/upload.js (NOVO ARQUIVO)

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Define o diretório temporário para onde os arquivos serão enviados
const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

module.exports = {
  directory: tmpFolder,

  // Configuração de armazenamento com o Multer
  storage: multer.diskStorage({
    destination: tmpFolder,
    filename(request, file, callback) {
      // Gera um hash aleatório para o nome do arquivo para evitar conflitos
      const fileHash = crypto.randomBytes(10).toString('hex');
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
