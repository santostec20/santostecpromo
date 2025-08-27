// redeploy again
// // api/meta-capi.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Somente POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // User-Agent e corpo
    const ua = (req.headers['user-agent'] as string) || '';
    const body = (req.body && typeof req.body === 'object') ? req.body as Record<string, any> : {};

    // Campos esperados do lado do cliente
    const {
      event_name,           // ex.: "ClickWhatsApp" | "ClickTelegram" | "PageView"
      event_id,             // mesmo usado no Pixel para deduplicação
      event_source_url,     // location.href do cliente
      value,                // opcional
      currency = 'BRL',
      fbp,
      fbc,
      client_ip_address,
    } = body || {};

    // Montagem do payload CAPI
    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: event_source_url || '',
          action_source: 'website',
          event_id: event_id || undefined,
          user_data: {
            client_user_agent: ua,
            client_ip_address: client_ip_address || undefined,
            fbp: fbp || undefined,
            fbc: fbc || undefined,
          },
          custom_data: {
            value: value != null ? Number(value) : undefined,
            currency,
          },
        },
      ],
    };

    // Token vindo da variável de ambiente da Vercel
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ ok: false, error: 'META_ACCESS_TOKEN ausente' });
    }

    // Seu Pixel ID (já preenchido)
    const PIXEL_ID = '1082709640237280';

    // Chamada à CAPI (Graph API)
    const resp = await fetch(`https://graph.facebook.com/v18.0/${PIXEL_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // access_token no corpo, conforme CAPI
      body: JSON.stringify({ ...payload, access_token: token }),
    });

    const result = await resp.json();

    // Retorno para o cliente
    return res.status(resp.ok ? 200 : 400).json({
      ok: resp.ok,
      meta_response: result,
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: 'Internal Error',
      detail: String(e?.message || e),
    });
  }
}
