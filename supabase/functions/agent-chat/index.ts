import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { startOfMonth, endOfMonth, formatISO } from "https://esm.sh/date-fns@2.30.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("Agent-chat function invoked.");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    if (!messages) {
      console.error("Request failed: No messages provided.");
      return new Response(JSON.stringify({ error: 'No se proporcionaron mensajes' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const accountsPromise = supabaseClient.from('accounts').select('name, currency, balance');
    const categoriesPromise = supabaseClient.from('categories').select('name');
    const budgetsPromise = supabaseClient.from('budgets').select('*, categories(name)').eq('month', formatISO(monthStart, { representation: 'date' }));
    const transactionsPromise = supabaseClient.from('transactions').select('description, amount, type, currency, date, categories(name)').gte('date', monthStart.toISOString()).lte('date', monthEnd.toISOString()).limit(50);

    const [
      { data: accounts, error: accountsError },
      { data: categories, error: categoriesError },
      { data: budgets, error: budgetsError },
      { data: transactions, error: transactionsError }
    ] = await Promise.all([accountsPromise, categoriesPromise, budgetsPromise, transactionsPromise]);

    if (accountsError || categoriesError || budgetsError || transactionsError) {
      console.error('Error fetching financial context:', { accountsError, categoriesError, budgetsError, transactionsError });
      return new Response(JSON.stringify({ error: 'Error al obtener el contexto financiero' }), { status: 500, headers: corsHeaders });
    }

    const financialContext = {
      accounts,
      categories,
      budgets,
      transactions,
      current_date: today.toISOString(),
    };

    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
    console.log("Retrieved N8N_WEBHOOK_URL:", n8nWebhookUrl ? "URL is set" : "URL is NOT SET or empty");

    if (!n8nWebhookUrl) {
      console.error("N8N_WEBHOOK_URL secret is not configured.");
      return new Response(JSON.stringify({ error: 'Error de configuración del servidor: N8N_WEBHOOK_URL no está configurado.' }), { status: 500, headers: corsHeaders });
    }

    console.log("Attempting to send request to n8n webhook...");
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context: financialContext }),
    });
    console.log("n8n response status:", n8nResponse.status);

    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text();
      console.error("Error from n8n webhook:", { status: n8nResponse.status, body: errorBody });
      return new Response(JSON.stringify({ error: 'Fallo al obtener respuesta del agente' }), { status: n8nResponse.status, headers: corsHeaders });
    }

    const responseData = await n8nResponse.json();
    console.log("Successfully received response from n8n.");
    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Critical error in agent-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})