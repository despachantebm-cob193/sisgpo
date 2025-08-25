const jwt = require('jsonwebtoken');

// Função principal do middleware
function authMiddleware(req, res, next) {
  // 1. Pega o token do cabeçalho da requisição
  const authHeader = req.headers.authorization;

  // 2. Verifica se o cabeçalho de autorização existe
  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido. Acesso negado.' });
  }

  // 3. O token vem no formato "Bearer <token>". Vamos separá-los.
  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ message: 'Erro no formato do token.' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ message: 'Token mal formatado.' });
  }

  // 4. Verifica se o token é válido
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // Se o token for inválido ou expirado, retorna um erro
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }

    // 5. Se o token for válido, anexa os dados do usuário (payload) à requisição
    req.userId = decoded.id;
    req.userPerfil = decoded.perfil;

    // 6. Chama a próxima função na cadeia (o controller da rota)
    return next();
  });
}

module.exports = authMiddleware;
