function responseHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    responseHeaders(res);
    return res.status(405).json({ ok: false, error: 'Use GET.' });
  }
  responseHeaders(res);
  return res.status(200).json({
    ok: true,
    providers: {
      serpApi: { configured: Boolean(process.env.SERPAPI_API_KEY) },
      barcodeLookup: { configured: Boolean(process.env.BARCODELOOKUP_API_KEY) },
      goUpc: { configured: Boolean(process.env.GOUPC_API_KEY) }
    },
    note: 'Configured means a key was saved. Use /api/diagnostics to validate provider access.'
  });
}
