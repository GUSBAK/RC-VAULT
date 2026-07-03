function text(value = '') {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
}

function responseHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
}

function mapError(error, fallback) {
  const status = Number(error?.status || 0);
  if (error?.name === 'AbortError') return { state: 'timeout', detail: 'Timed out. Try again.' };
  if ([401, 403].includes(status)) return { state: 'invalid_key', detail: 'API key rejected. Replace it in Vercel, then redeploy.' };
  if (status === 429) return { state: 'quota_exceeded', detail: 'Request limit reached. Check the provider plan, then retry.' };
  return { state: 'error', detail: text(error?.message || fallback).slice(0, 160) };
}

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body?.message || body?.error?.message || body?.error || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function checkSerpApi() {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) return { state: 'not_configured', detail: 'No key saved.' };
  try {
    const data = await fetchJson(`https://serpapi.com/account.json?api_key=${encodeURIComponent(key)}`);
    const left = Number(data?.total_searches_left ?? data?.plan_searches_left);
    const status = text(data?.account_status || 'Active');
    return { state: 'ready', detail: Number.isFinite(left) ? `${status}. ${left} searches left.` : `${status}. Key validated.` };
  } catch (error) {
    return mapError(error, 'Could not validate SerpApi.');
  }
}

async function checkBarcodeLookup() {
  const key = process.env.BARCODELOOKUP_API_KEY;
  if (!key) return { state: 'not_configured', detail: 'No key saved.' };
  try {
    const data = await fetchJson(`https://api.barcodelookup.com/v3/rate-limits?key=${encodeURIComponent(key)}`);
    const month = text(data?.remaining_calls_per_month);
    const minute = text(data?.remaining_calls_per_minute);
    const detail = month ? `${month} lookups left this month${minute ? `, ${minute} this minute.` : '.'}` : 'Key validated.';
    return { state: 'ready', detail };
  } catch (error) {
    return mapError(error, 'Could not validate Barcode Lookup.');
  }
}

function checkGoUpc() {
  return process.env.GOUPC_API_KEY
    ? { state: 'configured', detail: 'Key is saved. It will be checked on the next UPC or EAN scan.' }
    : { state: 'not_configured', detail: 'No key saved.' };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    responseHeaders(res);
    return res.status(405).json({ ok: false, error: 'Use GET.' });
  }
  const [serpApi, barcodeLookup] = await Promise.all([checkSerpApi(), checkBarcodeLookup()]);
  const providers = {
    hpiOfficial: { state: 'available', detail: 'Built-in direct lookup for HPI spare parts and complete HPI kits, including pasted HPI links.' },
    xrayOfficial: { state: 'available', detail: 'Built-in brand-scoped lookup. Select XRAY before checking a numeric part code.' },
    serpApi,
    barcodeLookup,
    goUpc: checkGoUpc()
  };
  responseHeaders(res);
  return res.status(200).json({ ok: true, providers });
}
