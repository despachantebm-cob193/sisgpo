import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';

const relatorioController = {
  getRelatorioDiario: async (req: Request, res: Response) => {
    const { data: dateParam } = req.query as { data?: string };
    if (!dateParam) {
      throw new AppError('A data é um parâmetro obrigatório (formato AAAA-MM-DD).', 400);
    }

    try {
      // 1. Serviço do Dia (Pessoas escaladas)
      // Original usava logica complexa de datas (between ou equals).
      // Assumindo modelo: servico_dia tem data_inicio e data_fim. Se vigência cobre 'dateParam'.
      const { data: servicoDiaRaw } = await supabaseAdmin
        .from('servico_dia')
        .select('*')
        .lte('data_inicio', dateParam)
        .gte('data_fim', dateParam);

      // Hydrate Serviço do Dia
      const servicoDia = await Promise.all(
        (servicoDiaRaw || []).map(async (sd: any) => {
          let nome = 'Não escalado';
          let posto = '';

          if (sd.pessoa_type === 'militar') {
            const { data: m } = await supabaseAdmin
              .from('militares')
              .select('nome_guerra, nome_completo, posto_graduacao')
              .eq('id', sd.pessoa_id)
              .single();
            if (m) {
              nome = (m.nome_guerra && m.nome_guerra.trim()) ? m.nome_guerra : m.nome_completo;
              posto = m.posto_graduacao || '';
            }
          } else if (sd.pessoa_type === 'civil') {
            const { data: c } = await supabaseAdmin
              .from('civis')
              .select('nome_completo')
              .eq('id', sd.pessoa_id)
              .single();
            if (c) {
              nome = c.nome_completo;
              posto = '';
            }
          }

          return {
            funcao: sd.funcao,
            posto_graduacao: posto,
            nome,
          };
        })
      );

      // 2. Plantões VTR (Viaturas e Guarnições)
      // Busca Plantões do dia
      const { data: plantoes } = await supabaseAdmin
        .from('plantoes')
        .select(`
          id,
          viatura_id,
          observacoes,
          viaturas (prefixo)
        `)
        .eq('data_plantao', dateParam);

      const plantoesVTR = await Promise.all(
        (plantoes || []).map(async (p: any) => {
          // Busca Guarnição para cada plantão
          // militar_plantao -> militares
          const { data: guarnicaoRaw } = await supabaseAdmin
            .from('militar_plantao')
            .select(`
              funcao,
              militares (nome_guerra, posto_graduacao)
            `)
            .eq('plantao_id', p.id);

          const guarnicao = (guarnicaoRaw || []).map((mr: any) => ({
            funcao: mr.funcao, // Se a coluna funcao nao existir, virá undefined (conforme migracao PlantaoRepository)
            posto_graduacao: mr.militares?.posto_graduacao,
            nome_guerra: mr.militares?.nome_guerra,
          }));

          return {
            id: p.id,
            prefixo: p.viaturas?.prefixo,
            observacoes: p.observacoes,
            guarnicao,
          };
        })
      );

      // Ordenar por prefixo
      plantoesVTR.sort((a, b) => (a.prefixo || '').localeCompare(b.prefixo || ''));

      // 3. Escala Aeronaves
      const { data: escalasAeronavesRaw } = await supabaseAdmin
        .from('escala_aeronaves')
        .select(`
          status,
          aeronaves (prefixo),
          p1:primeiro_piloto_id (nome_guerra, nome_completo, posto_graduacao),
          p2:segundo_piloto_id (nome_guerra, nome_completo, posto_graduacao)
        `)
        .eq('data', dateParam);

      const formatPiloto = (p: any) => {
        if (!p) return 'N/A';
        const nome = (p.nome_guerra && p.nome_guerra.trim())
          ? p.nome_guerra
          : (p.nome_completo ? p.nome_completo.split(' ')[0] : '');
        return `${p.posto_graduacao || ''} ${nome}`.trim();
      };

      const escalaAeronaves = (escalasAeronavesRaw || []).map((ea: any) => ({
        prefixo: ea.aeronaves?.prefixo,
        status: ea.status,
        primeiro_piloto: formatPiloto(Array.isArray(ea.p1) ? ea.p1[0] : ea.p1), // Supabase as vezes retorna array em joins
        segundo_piloto: formatPiloto(Array.isArray(ea.p2) ? ea.p2[0] : ea.p2),
      }));

      // 4. Escala Codec (Plantonistas)
      const { data: escalaCodecRaw } = await supabaseAdmin
        .from('escala_codec')
        .select(`
          turno,
          ordem_plantonista,
          militares (nome_guerra, posto_graduacao)
        `)
        .eq('data', dateParam)
        .order('turno', { ascending: true })
        .order('ordem_plantonista', { ascending: true });

      const escalaCodec = (escalaCodecRaw || []).map((ec: any) => {
        const m = Array.isArray(ec.militares) ? ec.militares[0] : ec.militares;
        return {
          turno: ec.turno,
          ordem_plantonista: ec.ordem_plantonista,
          nome_plantonista: m ? `${m.posto_graduacao || ''} ${m.nome_guerra || ''}`.trim() : '',
        };
      });

      // 5. Escala Médicos Civis
      const { data: civisEscalados } = await supabaseAdmin
        .from('civis')
        .select('nome_completo, funcao, entrada_servico, saida_servico, status_servico, observacoes')
        .lte('entrada_servico', dateParam) // Vigencia
        .gte('saida_servico', dateParam);

      const escalaMedicos = civisEscalados || [];

      return res.status(200).json({
        data_relatorio: dateParam,
        servicoDia,
        plantoesVTR,
        escalaAeronaves,
        escalaCodec,
        escalaMedicos,
      });

    } catch (error) {
      console.error('Erro ao gerar relatorio diario:', error);
      throw new AppError('Nao foi possivel consolidar os dados para o relatorio.', 500);
    }
  },
};

export = relatorioController;
