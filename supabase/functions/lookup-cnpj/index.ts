import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const REGIAO_BY_UF: Record<string, string> = {
  AC: 'norte', AP: 'norte', AM: 'norte', PA: 'norte', RO: 'norte', RR: 'norte', TO: 'norte',
  AL: 'nordeste', BA: 'nordeste', CE: 'nordeste', MA: 'nordeste', PB: 'nordeste', PE: 'nordeste', PI: 'nordeste', RN: 'nordeste', SE: 'nordeste',
  DF: 'centro_oeste', GO: 'centro_oeste', MT: 'centro_oeste', MS: 'centro_oeste',
  ES: 'sudeste', MG: 'sudeste', RJ: 'sudeste', SP: 'sudeste',
  PR: 'sul', RS: 'sul', SC: 'sul',
};

function isValidCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (base: string, weights: number[]) => {
    const sum = base.split('').reduce((acc, n, i) => acc + parseInt(n) * weights[i], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, ...w1];
  const d1 = calc(cnpj.slice(0, 12), w1);
  const d2 = calc(cnpj.slice(0, 13), w2);
  return d1 === parseInt(cnpj[12]) && d2 === parseInt(cnpj[13]);
}

function maskCNPJ(c: string): string {
  return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function maskCEP(c: string): string {
  const d = (c || '').replace(/\D/g, '');
  return d.length === 8 ? d.replace(/^(\d{5})(\d{3})$/, '$1-$2') : (c || '');
}

function mapPorte(p: string | undefined): string {
  if (!p) return '';
  const up = p.toUpperCase();
  if (up.includes('MEI') || up.includes('MICRO EMPRESARIO INDIVIDUAL')) return 'MEI';
  if (up.includes('MICRO')) return 'Micro';
  if (up.includes('PEQUEN')) return 'Pequena';
  if (up.includes('MEDI') || up.includes('MÉDI')) return 'Média';
  if (up.includes('DEMAIS') || up.includes('GRANDE')) return 'Grande';
  return '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { cnpj } = await req.json().catch(() => ({ cnpj: '' }));
    const clean = String(cnpj || '').replace(/\D/g, '');

    if (clean.length !== 14 || !isValidCNPJ(clean)) {
      return new Response(JSON.stringify({ error: 'CNPJ inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let resp: Response;
    try {
      resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'lovable-app/1.0' },
      });
    } catch (e) {
      console.error('BrasilAPI fetch threw:', e);
      return new Response(JSON.stringify({ error: 'Não foi possível consultar o CNPJ agora.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (resp.status === 404) {
      await resp.text().catch(() => {});
      return new Response(JSON.stringify({ error: 'CNPJ não encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error('BrasilAPI non-OK', resp.status, body?.slice(0, 300));
      // Fallback: try minhareceita.org
      try {
        const r2 = await fetch(`https://minhareceita.org/${clean}`, {
          headers: { 'Accept': 'application/json' },
        });
        if (r2.ok) {
          const m = await r2.json();
          const uf = (m.uf || '').toUpperCase();
          const payload = {
            cnpj: maskCNPJ(clean),
            razao_social: m.razao_social || '',
            nome_fantasia: m.nome_fantasia || m.razao_social || '',
            email: m.email || '',
            telefone: m.ddd_telefone_1 || m.ddd_telefone_2 || '',
            cep: maskCEP(m.cep || ''),
            logradouro: [m.descricao_tipo_de_logradouro, m.logradouro].filter(Boolean).join(' ').trim(),
            numero: m.numero || '',
            complemento: m.complemento || '',
            bairro: m.bairro || '',
            cidade: m.municipio || '',
            estado: uf,
            regiao: REGIAO_BY_UF[uf] || '',
            porte: mapPorte(m.porte),
            atividade_principal: m.cnae_fiscal_descricao || '',
            situacao: m.descricao_situacao_cadastral || '',
          };
          return new Response(JSON.stringify(payload), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        await r2.text().catch(() => {});
      } catch (e) {
        console.error('minhareceita fallback failed', e);
      }
      return new Response(JSON.stringify({ error: 'Não foi possível consultar o CNPJ agora.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const d = await resp.json();

    // Try ReceitaWS as enrichment when key fields are missing (email, logradouro, numero, etc.)
    let r: any = {};
    try {
      const rwResp = await fetch(`https://receitaws.com.br/v1/cnpj/${clean}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'lovable-app/1.0' },
      });
      if (rwResp.ok) {
        const rwData = await rwResp.json();
        if (rwData && rwData.status !== 'ERROR') r = rwData;
      } else {
        await rwResp.text().catch(() => {});
      }
    } catch (e) {
      console.error('ReceitaWS enrich failed', e);
    }

    const uf = (d.uf || r.uf || '').toUpperCase();
    const telefone =
      d.ddd_telefone_1 || d.ddd_telefone_2 || r.telefone || '';
    const logradouroFull =
      [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ').trim()
      || r.logradouro || '';

    const payload = {
      cnpj: maskCNPJ(clean),
      razao_social: d.razao_social || r.nome || '',
      nome_fantasia: d.nome_fantasia || r.fantasia || d.razao_social || r.nome || '',
      email: d.email || r.email || '',
      telefone,
      cep: maskCEP(d.cep || r.cep || ''),
      logradouro: logradouroFull,
      numero: d.numero || r.numero || '',
      complemento: d.complemento || r.complemento || '',
      bairro: d.bairro || r.bairro || '',
      cidade: d.municipio || r.municipio || '',
      estado: uf,
      regiao: REGIAO_BY_UF[uf] || '',
      porte: mapPorte(d.porte || r.porte),
      atividade_principal: d.cnae_fiscal_descricao || (r.atividade_principal?.[0]?.text) || '',
      situacao: d.descricao_situacao_cadastral || r.situacao || '',
    };

    return new Response(JSON.stringify(payload), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Não foi possível consultar o CNPJ agora.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
