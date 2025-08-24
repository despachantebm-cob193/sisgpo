const { Pool } = require('pg'); // Importa a classe Pool do pacote 'pg'

// O 'dotenv' já foi carregado no app.js, então podemos usar process.env aqui
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Testa a conexão ao iniciar
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar com o banco de dados:', err.stack);
  }
  console.log('✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso!');
  client.release(); // Libera o cliente de volta para o pool
});

// Exportamos o pool para que possamos usá-lo em outras partes da aplicação
module.exports = pool;
