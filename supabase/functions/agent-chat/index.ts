/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar la solicitud preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // NOTA: El JWT de autenticación del usuario no se verifica automáticamente.
    // Sería necesario añadir lógica para verificarlo si se quiere asegurar esta función.

    const { messages } = await req.json()

    if (!messages) {
      return new Response(JSON.stringify({ error: 'No se proporcionaron mensajes' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')

    if (!n8nWebhookUrl) {
      console.error('La variable N8N_WEBHOOK_URL no está configurada en los secretos de Supabase.');
      return new Response(JSON.stringify({ error: 'Error de configuración del servidor' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Reenviar los mensajes al webhook de n8n
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text();
      console.error('Error del webhook de n8n:', errorBody);
      return new Response(JSON.stringify({ error: 'Fallo al obtener respuesta del agente' }), {
        status: n8nResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const responseData = await n8nResponse.json();

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error en la función agent-chat:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})