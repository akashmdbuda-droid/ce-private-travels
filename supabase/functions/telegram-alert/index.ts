import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const record = payload.record

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID")

    if (!botToken || !chatId) {
      throw new Error("Missing system environment allocation keys.")
    }

    const text = `🚨 *NEW EURODRIVE INQUIRY RECEIVED* 🚨\n\n` +
                 `👤 *Customer:* ${record.customer_name}\n` +
                 `📍 *From:* ${record.pickup_location}\n` +
                 `🏁 *To:* ${record.destination_location}\n` +
                 `👥 *Passengers:* ${record.pax_count}\n` +
                 `📅 *Schedule:* ${record.travel_datetime}\n` +
                 `📊 *Source Channel:* ${record.lead_source}\n\n` +
                 `💬 *Immediate Action Link:* https://wa.me/${record.whatsapp_number.replace(/\s+/g, '')}`;

    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    
    const response = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown"
      })
    })

    const result = await response.json()

    return new Response(JSON.stringify({ success: true, telemetry: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
