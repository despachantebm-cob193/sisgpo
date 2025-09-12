// Arquivo: diagnostico.js

console.log('--- INICIANDO SCRIPT DE DIAGNÓSTICO DE ROTAS ---');

// Lista de todos os controladores que adminRoutes.js importa
const controladores = {
  militarController: require('./src/controllers/militarController'),
  obmController: require('./src/controllers/obmController'),
  viaturaController: require('./src/controllers/viaturaController'),
  plantaoController: require('./src/controllers/plantaoController'),
  escalaMedicoController: require('./src/controllers/escalaMedicoController'),
  userController: require('./src/controllers/userController'),
  dashboardController: require('./src/controllers/dashboardController'),
  viaturaFileController: require('./src/controllers/viaturaFileController'),
  obmFileController: require('./src/controllers/obmFileController'),
  servicoDiaController: require('./src/controllers/servicoDiaController'),
  escalaAeronaveController: require('./src/controllers/escalaAeronaveController'),
  escalaCodecController: require('./src/controllers/escalaCodecController'),
};

// Lista de todas as funções que esperamos que existam em cada controlador
const funcoesEsperadas = {
  militarController: ['getAll', 'search', 'create', 'update', 'delete'],
  obmController: ['getAll', 'search', 'create', 'update', 'delete'],
  viaturaController: ['getAll', 'getDistinctObms', 'create', 'update', 'delete', 'clearAll'],
  plantaoController: ['getAll', 'getById', 'create', 'update', 'delete'],
  escalaMedicoController: ['getAllCivis', 'searchCivis', 'createCivil', 'updateCivil', 'deleteCivil', 'getAllEscalas', 'createEscala', 'deleteEscala'],
  userController: ['changePassword'],
  dashboardController: ['getStats', 'getViaturaStatsPorTipo', 'getMilitarStats', 'getViaturaStatsDetalhado', 'getViaturaStatsPorObm', 'getServicoDia', 'getMetadataByKey'],
  viaturaFileController: ['upload'],
  obmFileController: ['upload'],
  servicoDiaController: ['getByDate', 'save'],
  escalaAeronaveController: ['getAll', 'create', 'delete'],
  escalaCodecController: ['getAll', 'create', 'delete'],
};

let erroEncontrado = false;

console.log('\n[PASSO 1] Verificando a existência dos controladores...\n');

for (const nomeControlador in controladores) {
  if (typeof controladores[nomeControlador] !== 'object' || controladores[nomeControlador] === null) {
    console.error(`❌ ERRO FATAL: O controlador "${nomeControlador}" não foi encontrado ou é nulo.`);
    erroEncontrado = true;
  } else {
    console.log(`✅ SUCESSO: Controlador "${nomeControlador}" carregado.`);
  }
}

if (erroEncontrado) {
  console.error('\nCorrija os erros de importação de controladores acima antes de continuar.');
  process.exit(1);
}

console.log('\n[PASSO 2] Verificando as funções dentro de cada controlador...\n');

for (const nomeControlador in funcoesEsperadas) {
  console.log(`--- Verificando "${nomeControlador}" ---`);
  const controlador = controladores[nomeControlador];
  
  for (const nomeFuncao of funcoesEsperadas[nomeControlador]) {
    if (typeof controlador[nomeFuncao] !== 'function') {
      console.error(`  ❌ FALHA: A função "${nomeFuncao}" está INDEFINIDA (undefined) em "${nomeControlador}".`);
      erroEncontrado = true;
    } else {
      console.log(`  ✅ OK: A função "${nomeFuncao}" existe.`);
    }
  }
  console.log(''); // Linha em branco para separar
}

console.log('--- FIM DO DIAGNÓSTICO ---');

if (erroEncontrado) {
  console.error('\n[RESULTADO] Um ou mais erros foram encontrados. A função que está causando o erro no "adminRoutes.js" está marcada como "FALHA" acima.');
} else {
  console.log('\n[RESULTADO] ✅ Nenhuma função indefinida foi encontrada. O problema pode ser outro.');
}
