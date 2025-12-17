import bcrypt from 'bcryptjs';
import db from './config/database';

const ADMIN_LOGIN = (process.env.ADMIN_LOGIN || 'admin').trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_PERFIL = 'administrador';
const ADMIN_NOME_COMPLETO = 'Administrador do Sistema';

async function ensureCriticalUserColumnsRaw(knex: any) {
  try {
    await knex.raw(
      'SELECT login, senha_hash, perfil, nome_completo, nome, ativo, email, google_id FROM usuarios LIMIT 1',
    );
    return;
  } catch (e: any) {
    if (e.code !== '42703') throw e;

    console.log('[Bootstrap Fix - RAW SQL] Colunas criticas ausentes. Aplicando ALTER TABLE forçado...');

    await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS login VARCHAR(50);`);
    await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);`);
    await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil VARCHAR(20);`);
    await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN;`);
    await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(255);`);
    await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nome VARCHAR(255);`);
    await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(255);`);
    await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);`);

    await knex.raw(`UPDATE usuarios SET login = 'temp_user_' || id::text WHERE login IS NULL;`);
    await knex.raw(`UPDATE usuarios SET senha_hash = '' WHERE senha_hash IS NULL;`);
    await knex.raw(`UPDATE usuarios SET perfil = 'Usuario' WHERE perfil IS NULL;`);
    await knex.raw(`UPDATE usuarios SET ativo = TRUE WHERE ativo IS NULL;`);
    await knex.raw(`UPDATE usuarios SET nome_completo = 'Nome Incompleto' WHERE nome_completo IS NULL;`);
    await knex.raw(`UPDATE usuarios SET nome = 'Nome Incompleto' WHERE nome IS NULL;`);
    await knex.raw(`UPDATE usuarios SET email = 'temp_email_' || id::text || '@temp.com' WHERE email IS NULL;`);

    await knex.raw(`ALTER TABLE usuarios ALTER COLUMN login SET NOT NULL;`);
    await knex.raw(`ALTER TABLE usuarios ALTER COLUMN senha_hash SET NOT NULL;`);
    await knex.raw(`ALTER TABLE usuarios ALTER COLUMN perfil SET NOT NULL;`);
    await knex.raw(`ALTER TABLE usuarios ALTER COLUMN ativo SET NOT NULL;`);
    await knex.raw(`ALTER TABLE usuarios ALTER COLUMN nome_completo SET NOT NULL;`);
    await knex.raw(`ALTER TABLE usuarios ALTER COLUMN nome SET NOT NULL;`);
    await knex.raw(`ALTER TABLE usuarios ALTER COLUMN email SET NOT NULL;`);

    await knex.raw(`
      DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_login_unique') THEN
              ALTER TABLE usuarios ADD CONSTRAINT usuarios_login_unique UNIQUE (login);
          END IF;
      END $$;
    `);
    await knex.raw(`
      DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_google_id_unique') THEN
              ALTER TABLE usuarios ADD CONSTRAINT usuarios_google_id_unique UNIQUE (google_id);
          END IF;
      END $$;
    `);

    console.log('[Bootstrap Fix] Correcao RAW SQL aplicada com sucesso.');
  }
}

async function ensureCriticalPlantaoColumnsRaw(knex: any) {
  try {
    await knex.raw('SELECT id, data_plantao, viatura_id, obm_id FROM plantoes LIMIT 1');
    return;
  } catch (e: any) {
    if (e.code !== '42703') throw e;

    console.log('[Bootstrap Fix - RAW SQL] Colunas criticas ausentes em "plantoes". Aplicando ALTER TABLE forçado...');

    await knex.raw(`ALTER TABLE plantoes ADD COLUMN IF NOT EXISTS data_plantao DATE;`);
    await knex.raw(`ALTER TABLE plantoes ADD COLUMN IF NOT EXISTS viatura_id INTEGER;`);
    await knex.raw(`ALTER TABLE plantoes ADD COLUMN IF NOT EXISTS obm_id INTEGER;`);
    await knex.raw(`ALTER TABLE plantoes ADD COLUMN IF NOT EXISTS observacoes TEXT;`);
    await knex.raw(`ALTER TABLE plantoes ADD COLUMN IF NOT EXISTS hora_inicio TIME;`);
    await knex.raw(`ALTER TABLE plantoes ADD COLUMN IF NOT EXISTS hora_fim TIME;`);

    const result = await knex('plantoes').count('id as count').first();
    const count = Number(result?.count || 0);
    if (count === 0) {
      await knex.raw(`ALTER TABLE plantoes ALTER COLUMN data_plantao SET NOT NULL;`);
      await knex.raw(`ALTER TABLE plantoes ALTER COLUMN viatura_id SET NOT NULL;`);
      await knex.raw(`ALTER TABLE plantoes ALTER COLUMN obm_id SET NOT NULL;`);
    }

    console.log('[Bootstrap Fix] Correcao RAW SQL para "plantoes" aplicada com sucesso.');
  }
}

async function ensurePlantaoRelations(knex: any) {
  const hasPlantoesMilitares = await knex.schema.hasTable('plantoes_militares');

  if (!hasPlantoesMilitares) {
    const hasLegacyTable = await knex.schema.hasTable('militar_plantao');

    if (hasLegacyTable) {
      console.log('[Bootstrap Fix] Renomeando tabela legacy "militar_plantao" para "plantoes_militares"...');
      await knex.schema.renameTable('militar_plantao', 'plantoes_militares');
    } else {
      console.log('[Bootstrap Fix] Criando tabela "plantoes_militares"...');
      await knex.schema.createTable('plantoes_militares', (table: any) => {
        table.increments('id').primary();
        table
          .integer('plantao_id')
          .unsigned()
          .references('id')
          .inTable('plantoes')
          .onDelete('CASCADE')
          .notNullable();
        table
          .integer('militar_id')
          .unsigned()
          .references('id')
          .inTable('militares')
          .onDelete('CASCADE')
          .notNullable();
        table.string('funcao', 100).notNullable().defaultTo('DESCONHECIDA');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.unique(['plantao_id', 'militar_id'], 'plantoes_militares_unique');
      });
    }
  }

  const ensureColumn = async (columnName: string, buildCallback: (table: any) => void, onPopulate?: () => Promise<void>) => {
    const exists = await knex.schema.hasColumn('plantoes_militares', columnName);
    if (!exists) {
      await knex.schema.alterTable('plantoes_militares', buildCallback);
      if (onPopulate) {
        await onPopulate();
      }
    }
  };

  await ensureColumn(
    'funcao',
    (table) => {
      table.string('funcao', 100).defaultTo('DESCONHECIDA');
    },
    async () => {
      await knex('plantoes_militares').update({ funcao: 'DESCONHECIDA' });
      await knex.schema.alterTable('plantoes_militares', (table: any) => {
        table.string('funcao', 100).notNullable().defaultTo('DESCONHECIDA').alter();
      });
    },
  );

  await ensureColumn('created_at', (table) => {
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await ensureColumn('updated_at', (table) => {
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.raw(`
    DO $$ BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'plantoes_militares_unique'
        ) THEN
            ALTER TABLE plantoes_militares
            ADD CONSTRAINT plantoes_militares_unique UNIQUE (plantao_id, militar_id);
        END IF;
    END $$;
  `);
}

async function bootstrapDatabase() {
  console.log('[Bootstrap] Iniciando verificacao e populacao de dados essenciais...');

  try {
    await ensureCriticalUserColumnsRaw(db);
    await ensureCriticalPlantaoColumnsRaw(db);
    await ensurePlantaoRelations(db);

    const adminUser = await db('usuarios').where({ login: ADMIN_LOGIN }).first();

    if (adminUser) {
      console.log('[Bootstrap] O usuario admin ja existe. Pulando criacao.');
      return;
    }

    console.log('[Bootstrap] Usuario admin nao encontrado. Populando o banco de dados com dados iniciais...');

    const senhaPlana = ADMIN_PASSWORD;
    const senhaHash = await bcrypt.hash(senhaPlana, 10);

    await db('usuarios').insert({
      login: ADMIN_LOGIN,
      senha_hash: senhaHash,
      perfil: ADMIN_PERFIL,
      ativo: true,
      nome_completo: ADMIN_NOME_COMPLETO,
      nome: ADMIN_NOME_COMPLETO,
      email: `${ADMIN_LOGIN}@sisgpo.com`,
    });
    console.log('-> Usuario "admin" criado com sucesso.');

    const obmSeed = {
      nome: 'Comando Geral do Corpo de Bombeiros',
      abreviatura: 'CGCBM',
      cidade: 'Goiania',
      telefone: '6232012000',
    };

    const existingObm = await db('obms').where({ nome: obmSeed.nome }).first();

    if (!existingObm) {
      await db('obms').insert(obmSeed);
      console.log(`-> OBM "${obmSeed.nome}" criada com sucesso.`);
    } else {
      console.log(`-> OBM "${obmSeed.nome}" ja existe. Pulando criacao.`);
    }

    const militarSeed = {
      matricula: '000000',
      nome_completo: ADMIN_NOME_COMPLETO,
      nome_guerra: 'Admin',
      posto_graduacao: 'Sistema',
      ativo: true,
      obm_nome: obmSeed.nome,
    };

    const existingMilitar = await db('militares').where({ matricula: militarSeed.matricula }).first();

    if (!existingMilitar) {
      await db('militares').insert(militarSeed);
      console.log(`-> Militar "${militarSeed.nome_completo}" criado com sucesso.`);
    } else {
      console.log(`-> Militar com matricula ${militarSeed.matricula} ja existe. Pulando criacao.`);
    }

    const viaturaSeed = {
      prefixo: 'VTR-ADM',
      ativa: true,
      cidade: 'Goiania',
      obm: obmSeed.nome,
    };

    const existingViatura = await db('viaturas').where({ prefixo: viaturaSeed.prefixo }).first();

    if (!existingViatura) {
      await db('viaturas').insert(viaturaSeed);
      console.log(`-> Viatura "${viaturaSeed.prefixo}" criada com sucesso.`);
    } else {
      console.log(`-> Viatura "${viaturaSeed.prefixo}" ja existe. Pulando criacao.`);
    }

    console.log('OK. [Bootstrap] Banco de dados populado com sucesso!');
  } catch (error) {
    console.error(`ERRO [Bootstrap] Erro critico durante o processo de bootstrap: ${error}`);
    throw error;
  }
}

export = bootstrapDatabase;
