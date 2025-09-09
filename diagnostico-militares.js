// backend/diagnostico-militares.js

const xlsx = require('xlsx');
const path = require('path');

function runMilitarDiagnosis() {
  console.log('--- INICIANDO SCRIPT DE DIAGNÓSTICO DE IMPORTAÇÃO DE MILITARES ---');

  try {
    // IMPORTANTE: Coloque a sua planilha de militares (o arquivo .xlsx)
    // dentro da pasta 'backend' e renomeie para 'efetivo.xlsx' para este teste.
    const filePath = path.resolve(__dirname, 'efetivo.xlsx');

    console.log(`\n[PASSO 1] Lendo o arquivo: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    console.log('\n[PASSO 2] Convertendo a planilha para um array de objetos...');
    const rowsAsObjects = xlsx.utils.sheet_to_json(worksheet, {
      header: 1, // Lê todas as linhas como arrays
      defval: ""
    });

    if (rowsAsObjects.length < 2) {
      throw new Error('A planilha parece estar vazia ou contém apenas o cabeçalho.');
    }

    // --- ANÁLISE DOS DADOS ---
    console.log('\n[PASSO 3] Analisando os cabeçalhos e a primeira linha de dados...');

    const headers = rowsAsObjects[0];
    const firstDataRow = rowsAsObjects[1];

    console.log('\n--- CABEÇALHOS ENCONTRADOS (RAW) ---');
    console.log(headers);
    console.log('------------------------------------');

    console.log('\n--- PRIMEIRA LINHA DE DADOS (RAW) ---');
    console.log(firstDataRow);
    console.log('-------------------------------------');

    // Simula a criação do objeto da primeira linha
    const rowObject = headers.reduce((obj, header, index) => {
      obj[String(header).trim()] = firstDataRow[index]; // Usa o cabeçalho original como chave
      return obj;
    }, {});

    console.log('\n--- OBJETO GERADO A PARTIR DA PRIMEIRA LINHA ---');
    console.log(rowObject);
    console.log('------------------------------------------------');

    // Extrai os campos que estamos tentando validar
    const matricula = rowObject['Matrícula'] || rowObject['matricula'];
    const nomeCompleto = rowObject['Nome Completo'] || rowObject['nome completo'] || rowObject['nome_completo'];

    console.log('\n[PASSO 4] Verificando os campos chave para validação...');
    console.log(`> Valor extraído para 'matricula':`, matricula);
    console.log(`> Valor extraído para 'nome_completo':`, nomeCompleto);

    if (!matricula || !nomeCompleto) {
      console.log('\n\n[CONCLUSÃO] FALHA NA VALIDAÇÃO! Um dos campos chave (matrícula ou nome_completo) não foi encontrado ou está vazio.');
      console.log('Verifique se os nomes dos cabeçalhos no console correspondem exatamente aos que você está tentando acessar.');
    } else {
      console.log('\n\n[CONCLUSÃO] SUCESSO NA VALIDAÇÃO! Os campos chave foram encontrados. O problema pode estar em outro lugar.');
    }

  } catch (error) {
    console.error('\n❌ [ERRO] Ocorreu um erro durante o diagnóstico!');
    if (error.code === 'ENOENT') {
      console.error("ERRO: Arquivo 'efetivo.xlsx' não encontrado na pasta 'backend'. Por favor, adicione-o e tente novamente.");
    } else {
      console.error('Mensagem do Erro:', error.message);
    }
  } finally {
    console.log('\n--- FIM DO SCRIPT DE DIAGNÓSTICO ---');
  }
}

runMilitarDiagnosis();
