/// <reference path="../../globals.d.ts" />

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
    const transactionsPromise = supabaseClient.from('transactions').select('amount, type, currency, categories(name)').gte('date', monthStart.toISOString()).lte('date', monthEnd.toISOString());

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

    // --- Start of Financial Summary Calculation ---
    const financialSummary = (transactions || []).reduce((acc, tx) => {
      const currency = tx.currency || 'unknown';
      if (!acc[currency]) {
        acc[currency] = {
          total_income: 0,
          total_expense: 0,
          transaction_count: 0,
          spending_by_category: {},
        };
      }

      acc[currency].transaction_count++;
      if (tx.type === 'income') {
        acc[currency].total_income += tx.amount;
      } else {
        acc[currency].total_expense += tx.amount;
        const categoryName = tx.categories?.name || 'Sin Categoría';
        acc[currency].spending_by_category[categoryName] = (acc[currency].spending_by_category[categoryName] || 0) + tx.amount;
      }

      return acc;
    }, {} as any);

    // Process summary to get top categories and net savings
    for (const currency in financialSummary) {
      const summary = financialSummary[currency];
      summary.net_savings = summary.total_income - summary.total_expense;
      
      const top_spending_categories = Object.entries(summary.spending_by_category)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount }));

      summary.top_spending_categories = top_spending_categories;
      delete summary.spending_by_category; // Clean up intermediate data
    }
    // --- End of Financial Summary Calculation ---

    const financialContext = {
      user_id: user.id,
      full_name: user.user_metadata.full_name || user.email,
      accounts,
      categories,
      budgets,
      financial_summary: financialSummary, // Use the summary instead of raw transactions
      current_date: today.toISOString(),
    };

    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
    if (!n8nWebhookUrl) {
      return new Response(JSON.stringify({ error: 'Error de configuración del servidor' }), { status: 500, headers: corsHeaders });
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context: financialContext }),
    });

    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text();
      console.error("Error from n8n:", errorBody);
      return new Response(JSON.stringify({ error: 'Fallo al obtener respuesta del agente' }), { status: n8nResponse.status, headers: corsHeaders });
    }

    return new Response(n8nResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      status: 200,
    });

  } catch (error) {
    console.error('Error en la función agent-chat:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})