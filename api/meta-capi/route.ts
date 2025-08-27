export const runtime = 'nodejs';
export const maxDuration = 15;

export async function POST(req: Request) {
try {
const ua = req.headers.get('user-agent') || '';
const body = await req.json().catch(() => ({}));
const {
event_name, // ClickWhatsApp | ClickTelegram | PageView
event_id, // mesmo usado no Pixel
event_source_url, // location.href do cliente
value, // opcional
currency = 'BRL',
fbp, fbc,
client_ip_address
} = body || {};
const payload = {
  data: [
    {
      event_name,
      event_time: Math.floor(Date.now()/1000),
      event_source_url: event_source_url || '',
      action_source: 'website',
      event_id: event_id || undefined,
      user_data: {
        client_user_agent: ua,
        client_ip_address: client_ip_address || undefined,
        fbp: fbp || undefined,
        fbc: fbc || undefined
      },
      custom_data: {
        value: value != null ? Number(value) : undefined,
        currency
      }
    }
  ]
};

const pixelId = '1082709640237280';
const token = process.env.META_ACCESS_TOKEN;

const resp = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${token}`, {
  method: 'POST',
  headers: { 'Content-Type':'application/json' },
  body: JSON.stringify(payload)
});
const result = await resp.json();
return new Response(JSON.stringify({ ok: resp.ok, meta_response: result }), {
  status: resp.ok ? 200 : 400,
  headers: { 'Content-Type':'application/json' }
});
} catch (e:any) {
return new Response(JSON.stringify({ ok:false, error: e?.message || 'unknown' }), {
status: 500, headers: { 'Content-Type':'application/json' }
});
}
}

Observações

action_source='website', client_user_agent e event_source_url são exigidos para “eventos de site”; fbp/fbc aumentam a correspondência, quando existirem.

Deduplicação exige MESMO event_name e MESMO event_id no Pixel e na CAPI para cada clique/visualização.