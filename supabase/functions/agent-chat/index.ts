import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { startOfMonth, endOfMonth, formatISO } from "https://esm.sh/date-fns@2.30.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    if (!messages) {
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

    // Obtener la información del usuario
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(JSON.stringify({ error: 'No se pudo autenticar al usuario' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      user_id: user.id,
      full_name: user.user_metadata.full_name || user.email,
      accounts,
      categories,
      budgets,
      transactions,
      current_date: today.toISOString(),
    };

    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
    if (!n8nWebhookUrl) {
      return new Response(JSON.stringify({ error: 'Error de configuración del servidor' }), { status: 500, headers: corsHeaders });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let n8nResponse;
    try {
      n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, context: financialContext }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text();
      console.error("Error from n8n:", errorBody);
      return new Response(JSON.stringify({ error: 'Fallo al obtener respuesta del agente' }), { status: n8nResponse.status, headers: corsHeaders });
    }

    const responseData = await n8nResponse.json();
    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error en la función agent-chat:', error);
    const errorMessage = error.name === 'AbortError' ? 'La solicitud al agente ha tardado demasiado (timeout).' : error.message;
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})