import { supabaseAdmin } from './config/supabase';
import bcrypt from 'bcryptjs';

const ADMIN_LOGIN = (process.env.ADMIN_LOGIN || 'admin').trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_PERFIL = 'administrador';
const ADMIN_NOME_COMPLETO = 'Administrador do Sistema';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || `admin@sisgpo.com`;

async function bootstrapDatabase() {
  console.log('[Bootstrap] Iniciando verificação de dados essenciais via Supabase...');

  try {
    // 1. Garantir Admin no Supabase Auth
    let adminAuthId: string | null = null;

    // Tenta buscar usuario por email no Auth (Admin API requer getUserById ou listUsers)
    // List users filter
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    let authUser = users?.find(u => u.email === ADMIN_EMAIL);

    if (!authUser) {
      console.log('[Bootstrap] Admin Auth nao encontrado. Criando em auth.users...');
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { perfil: ADMIN_PERFIL }
      });

      if (createError) {
        console.error('[Bootstrap] Erro critico ao criar Admin Auth:', createError);
      } else {
        authUser = newUser.user;
        console.log('[Bootstrap] Admin Auth criado com sucesso via API.');
      }
    } else {
      console.log('[Bootstrap] Admin Auth ja existe.');
    }

    if (authUser) {
      adminAuthId = authUser.id;
    }

    // 2. Verificar/Criar Admin na tabela publica users
    const { data: adminUser } = await supabaseAdmin
      .from('usuarios')
      .select('id, supabase_id')
      .eq('login', ADMIN_LOGIN)
      .single();

    if (adminUser) {
      console.log('[Bootstrap] Usuario admin legado ja existe.');
      // Update Link se necessario
      if (adminAuthId && adminUser.supabase_id !== adminAuthId) {
        console.log('[Bootstrap] Vinculando admin legado ao Admin Auth...');
        await supabaseAdmin
          .from('usuarios')
          .update({ supabase_id: adminAuthId })
          .eq('id', adminUser.id);
      }
    } else {
      console.log('[Bootstrap] Usuario admin legado nao encontrado. Criando...');
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

      const { error: createError } = await supabaseAdmin.from('usuarios').insert({
        login: ADMIN_LOGIN,
        senha_hash: senhaHash,
        perfil: ADMIN_PERFIL,
        ativo: true,
        nome_completo: ADMIN_NOME_COMPLETO,
        nome: ADMIN_NOME_COMPLETO,
        email: ADMIN_EMAIL,
        supabase_id: adminAuthId // Link direto
      });

      if (createError) {
        console.error('[Bootstrap] Erro ao criar admin legado:', createError);
      } else {
        console.log('-> Usuario "admin" legado criado com sucesso.');
      }
    }

    // 3. OBM Seed
    const obmSeed = {
      nome: 'Comando Geral do Corpo de Bombeiros',
      abreviatura: 'CGCBM',
      cidade: 'Goiania',
      telefone: '6232012000',
      crbm: '1',
    };

    const { data: existingObm } = await supabaseAdmin
      .from('obms')
      .select('id')
      .eq('nome', obmSeed.nome)
      .single();

    if (!existingObm) {
      await supabaseAdmin.from('obms').insert(obmSeed);
      console.log(`-> OBM "${obmSeed.nome}" criada com sucesso.`);
    }

    // 4. Viatura Seed
    const viaturaSeed = {
      prefixo: 'VTR-ADM',
      ativa: true,
      cidade: 'Goiania',
      obm: obmSeed.nome,
    };

    const { data: existingViatura } = await supabaseAdmin
      .from('viaturas')
      .select('id')
      .eq('prefixo', viaturaSeed.prefixo)
      .single();

    if (!existingViatura) {
      await supabaseAdmin.from('viaturas').insert(viaturaSeed);
      console.log(`-> Viatura "${viaturaSeed.prefixo}" criada com sucesso.`);
    }

    console.log('[Bootstrap] Verificacao concluida.');
  } catch (error) {
    console.error(`ERRO [Bootstrap] Falha no bootstrap: ${error}`);
  }
}

export = bootstrapDatabase;
