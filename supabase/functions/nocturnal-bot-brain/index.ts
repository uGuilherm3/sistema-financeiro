import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GEMINI_API_KEY = "AIzaSyCZB2Tl-AR-7Dbt8qRTO0JyXo58Oe-pd-k";
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  try {
    const { record, table } = await req.json();
    console.log(`🤖 Bilu detectou atividade em ${table}. ID: ${record.id}`);

    // Pegar informações financeiras
    const { data: records } = await supabase.from('finance_records').select('*').eq('is_completed', false).gt('amount', 0);
    const { data: debts } = await supabase.from('debts').select('*').eq('is_completed', false).gt('amount', 0);

    // Calcular totais
    const totalRecords = records?.reduce((acc, r) => acc + r.amount, 0) || 0;
    const totalDebts = debts?.reduce((acc, d) => acc + d.amount, 0) || 0;
    const totalGlobal = totalRecords + totalDebts;

    const context = `
      STATUS DAS RELIQUIAS:
      - Dividas em records: R$ ${totalRecords}
      - Dividas em debts: R$ ${totalDebts}
      - TOTAL: R$ ${totalGlobal}
    `;

    // 1. Descobrir modelos disponíveis (Priorizando Gemini 3 Flash)
    const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const modelsData = await modelsResponse.json();
    const detectedModels = (modelsData.models || []).map(m => m.name);

    console.log("Satélites detectados:", detectedModels);

    // Prioridade Solar: Gemini 3 Flash > Gemini 2.0 Flash > Outros
    const priorityModels = [
      "models/gemini-3-flash-preview",
      "models/gemini-3-flash",
      "models/gemini-2.0-flash",
      "models/gemini-1.5-flash"
    ];

    const availableModels = priorityModels.filter(m => detectedModels.includes(m));
    if (availableModels.length === 0 && detectedModels.length > 0) {
      availableModels.push(detectedModels[0]); // Fallback para qualquer coisa detectada
    }

    let botResponse = "Sinal fraco com seu plano cósmico 👽";

    // Tentar cada modelo por ordem de prioridade
    for (const modelId of availableModels) {
      try {
        console.log(`📡 Tentando contato via ${modelId}...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `
              Você é o "Bilu", um assistente financeiro de um dashboard premium. 
              Sua personalidade: Conspiracionista, irônico, mas muito útil. 
              Fale pouco! Máximo 2 frases curtas. 
              Não use gírias excessivas.
              Responda em PORTUGUES DO BRASIL.

              CONTEXTO DO USUARIO:
              ${context}
              ${table === 'record_comments' ? `COMENTARIO DO USER: "${record.comment}"` : `NOVO ITEM: "${record.title}" de R$ ${record.amount}`}

              Regras:
              1. Comece com uma vibe humorística e mística.
              2. Dê a dica financeira real baseada nos totais se necessário.
              3. NUNCA diga seu nome ou branding desnecessário.
            `}]
            }],
            generationConfig: { maxOutputTokens: 100 }
          })
        });

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          botResponse = data.candidates[0].content.parts[0].text;
          console.log(`✅ Sucesso via ${modelId}`);
          break; // Sai do loop ao conseguir resposta
        }
      } catch (err) {
        console.error(`❌ Falha no satélite ${modelId}:`, err);
      }
    }

    // Salvar o comentário do Bilu
    await supabase.from('record_comments').insert({
      record_id: table === 'record_comments' ? record.record_id : record.id,
      comment: botResponse,
      author: 'system',
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
