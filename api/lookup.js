const RC_KEYWORDS = [
  ['Traxxas', /\b(traxxas|trx[-\s]?\d+|tra\d+)\b/i],
  ['ARRMA', /\b(arrma|ara[-\s]?\d+|arac\d+)\b/i],
  ['HPI Racing', /\b(hpi|hpiracing|hpi racing)\b/i],
  ['XRAY', /\b(xray|xray model|team xray|xr[-\s]?\d+)\b/i],
  ['Team Associated', /\b(team associated|associated|asc\d+)\b/i],
  ['Losi', /\b(losi|tlr[-\s]?\d+)\b/i],
  ['Axial', /\b(axial|axi[-\s]?\d+)\b/i],
  ['Maverick', /\b(maverick)\b/i],
  ['Kyosho', /\b(kyosho)\b/i],
  ['Tamiya', /\b(tamiya)\b/i]
];

const FCT_DOMAIN = 'fcthobby.com';
const PREFERRED_RETAILERS = [
  'fcthobby.com',
  'amainhobbies.com',
  'horizonhobby.com',
  'rcmart.com',
  'towerhobbies.com',
  'mcmracing.com',
  'campbelltownhobbies.com.au',
  'mkracing.eu',
  'arrma-rc.com',
  'traxxas.com',
  'hpiracing.com',
  'teamxray.com',
  'xray-modelracing.com'
];

function text(value = '') {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
}

function normalized(value = '') {
  return text(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function codeTokens(value = '') {
  const clean = text(value).toUpperCase();
  const compact = clean.replace(/[^A-Z0-9]/g, '');
  return [clean, compact].filter(Boolean);
}

function isBarcode(value = '') {
  return /^\d{8,14}$/.test(text(value));
}

function isLikelyCode(value = '') {
  const clean = text(value);
  return /^[A-Za-z0-9][A-Za-z0-9._\-/ ]{1,63}$/.test(clean);
}

function safeUrl(value = '') {
  try {
    const url = new URL(text(value));
    return /^https?:$/.test(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function host(value = '') {
  try {
    return new URL(value).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function sourceLabel(value = '') {
  const h = host(value);
  if (h === FCT_DOMAIN || h.endsWith(`.${FCT_DOMAIN}`)) return 'FCT Hobby Saudi';
  if (!h) return '';
  return h.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function detectBrand(...values) {
  const content = values.map(text).join(' ');
  const item = RC_KEYWORDS.find(([, pattern]) => pattern.test(content));
  return item ? item[0] : '';
}

function inferCategory(name = '') {
  const v = text(name).toLowerCase();
  if (/shock|spring|arm|suspension|hub|c-hub|knuckle|link set/.test(v)) return 'Suspension';
  if (/diff|gear|drive|shaft|slipper|pinion|spur|bearing/.test(v)) return 'Drivetrain';
  if (/servo|steer|bellcrank/.test(v)) return 'Steering';
  if (/wheel|tire|tyre|hex hub/.test(v)) return 'Wheels & tyres';
  if (/body|wing|bumper|chassis|skid/.test(v)) return 'Body & chassis';
  if (/motor|esc|battery|receiver|radio|charger|led/.test(v)) return 'Electronics';
  if (/screw|bolt|nut|clip|shim/.test(v)) return 'Hardware';
  return '';
}

function titleWithoutRetailer(value = '') {
  return text(value).replace(/\s+[|–—-]\s+(FCTHOBBY|FCT Hobby|AMain Hobbies|Horizon Hobby|RCMart|Tower Hobbies|MCM Racing|MK Racing|Campbelltown Hobbies).*$/i, '').trim();
}

function matchQuality(candidate, query) {
  const qTokens = codeTokens(query).map(normalized);
  const fields = [candidate.barcode, candidate.partNumber, candidate.sku, candidate.title, candidate.description]
    .map(value => normalized(value));
  const exact = qTokens.some(token => token && fields.some(field => field === token));
  const contains = qTokens.some(token => token && fields.some(field => field.includes(token)));
  return { exact, contains };
}

function scoreCandidate(candidate, query) {
  const { exact, contains } = matchQuality(candidate, query);
  let score = 0;
  if (candidate.provenance?.includes('Barcode Lookup') || candidate.provenance?.includes('Go-UPC')) score += 90;
  if (exact) score += 75;
  else if (contains) score += 42;
  if (candidate.brand) score += 5;
  if (candidate.imageUrl) score += 4;
  if (candidate.description) score += 3;
  if (candidate.sources?.some(s => s.supplier === 'FCT Hobby Saudi')) score += 7;
  if (candidate.sources?.some(s => s.url && PREFERRED_RETAILERS.some(domain => host(s.url).endsWith(domain)))) score += 4;
  if (candidate.sources?.some(s => s.price !== '')) score += 2;
  return Math.min(score, 100);
}

function confidence(score) {
  if (score >= 95) return 'Exact';
  if (score >= 72) return 'High';
  if (score >= 48) return 'Likely';
  return 'Possible';
}

function sanitizeCandidate(raw = {}) {
  const candidate = {
    title: text(raw.title || raw.name || raw.productName),
    brand: text(raw.brand || raw.manufacturer),
    partNumber: text(raw.partNumber || raw.mpn || raw.model || raw.manufacturerPartNumber),
    barcode: text(raw.barcode || raw.gtin || raw.ean || raw.upc || raw.barcodeNumber),
    sku: text(raw.sku),
    description: text(raw.description || raw.snippet),
    category: text(raw.category),
    imageUrl: safeUrl(raw.imageUrl || raw.image || raw.thumbnail || raw.image_url),
    sources: Array.isArray(raw.sources) ? raw.sources : [],
    provenance: Array.isArray(raw.provenance) ? raw.provenance : []
  };
  candidate.title = titleWithoutRetailer(candidate.title) || candidate.partNumber || candidate.barcode || 'RC part';
  candidate.brand ||= detectBrand(candidate.title, candidate.description, candidate.partNumber);
  candidate.category ||= inferCategory(candidate.title);
  candidate.sources = candidate.sources
    .map(source => ({
      supplier: text(source.supplier) || sourceLabel(source.url) || 'Online source',
      url: safeUrl(source.url),
      price: text(source.price),
      currency: text(source.currency),
      availability: text(source.availability),
      sourceType: text(source.sourceType)
    }))
    .filter(source => source.supplier || source.url || source.price);
  candidate.provenance = [...new Set(candidate.provenance.map(text).filter(Boolean))];
  return candidate;
}

function candidateFromBarcodeLookup(product, query) {
  const images = Array.isArray(product?.images) ? product.images : [];
  const stores = Array.isArray(product?.stores) ? product.stores : [];
  const sources = stores.map(store => ({
    supplier: text(store.store_name || store.store || store.name),
    url: text(store.store_url || store.url || store.link || store.product_url),
    price: text(store.store_price ?? store.price ?? store.sale_price),
    currency: text(store.currency || store.store_currency),
    availability: text(store.availability || store.stock_status),
    sourceType: 'Barcode database'
  }));
  return sanitizeCandidate({
    title: product?.title || product?.name,
    brand: product?.brand || product?.manufacturer,
    partNumber: product?.mpn || product?.model,
    barcode: product?.barcode_number || product?.barcode || (isBarcode(query) ? query : ''),
    description: product?.description,
    category: product?.category,
    imageUrl: images[0]?.url || images[0] || product?.image_url,
    sources,
    provenance: ['Barcode Lookup']
  });
}

function candidateFromGoUpc(payload, query) {
  const product = payload?.product || payload?.data?.product || payload?.data || {};
  return sanitizeCandidate({
    title: product?.name || product?.title,
    brand: product?.brand || product?.manufacturer,
    partNumber: product?.mpn || product?.model || product?.modelNumber,
    barcode: product?.barcode || product?.upc || product?.ean || product?.gtin || (isBarcode(query) ? query : ''),
    description: product?.description,
    category: product?.category,
    imageUrl: product?.imageUrl || product?.image_url || product?.image,
    sources: [],
    provenance: ['Go-UPC']
  });
}

function candidateFromShopping(item, query) {
  const url = safeUrl(item?.link || item?.product_link || item?.productLink || '');
  return sanitizeCandidate({
    title: item?.title,
    brand: detectBrand(item?.title, query),
    partNumber: !isBarcode(query) && normalized(item?.title).includes(normalized(query)) ? query : '',
    barcode: isBarcode(query) && normalized(item?.title).includes(normalized(query)) ? query : '',
    description: item?.snippet || item?.extensions?.join(', ') || '',
    imageUrl: item?.thumbnail || item?.serpapi_thumbnail || item?.image,
    sources: [{
      supplier: text(item?.source) || sourceLabel(url),
      url,
      price: text(item?.price || item?.extracted_price),
      currency: text(item?.currency),
      availability: text(item?.availability || item?.delivery),
      sourceType: 'Google Shopping'
    }],
    provenance: ['Google Shopping']
  });
}

function candidateFromOrganic(item, query) {
  const url = safeUrl(item?.link || item?.url || '');
  return sanitizeCandidate({
    title: item?.title,
    brand: detectBrand(item?.title, item?.snippet, query),
    partNumber: !isBarcode(query) && normalized(`${item?.title || ''} ${item?.snippet || ''}`).includes(normalized(query)) ? query : '',
    barcode: isBarcode(query) && normalized(`${item?.title || ''} ${item?.snippet || ''}`).includes(normalized(query)) ? query : '',
    description: item?.snippet,
    imageUrl: item?.thumbnail || item?.favicon,
    sources: [{
      supplier: sourceLabel(url),
      url,
      price: '',
      currency: '',
      availability: '',
      sourceType: 'Google Search'
    }],
    provenance: ['Google Search']
  });
}

function mergeCandidates(items, query) {
  const groups = new Map();
  for (const sourceCandidate of items) {
    const candidate = sanitizeCandidate(sourceCandidate);
    if (!candidate.title || candidate.title === 'RC part') continue;
    const code = normalized(candidate.partNumber || candidate.barcode || candidate.sku);
    const key = code || normalized(candidate.title).slice(0, 96);
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, candidate);
      continue;
    }
    if (!existing.description && candidate.description) existing.description = candidate.description;
    if (!existing.imageUrl && candidate.imageUrl) existing.imageUrl = candidate.imageUrl;
    if (!existing.brand && candidate.brand) existing.brand = candidate.brand;
    if (!existing.partNumber && candidate.partNumber) existing.partNumber = candidate.partNumber;
    if (!existing.barcode && candidate.barcode) existing.barcode = candidate.barcode;
    if (!existing.category && candidate.category) existing.category = candidate.category;
    existing.sources = [...existing.sources, ...candidate.sources];
    existing.provenance = [...new Set([...existing.provenance, ...candidate.provenance])];
  }
  return [...groups.values()]
    .map(candidate => ({ ...candidate, score: scoreCandidate(candidate, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(candidate => ({ ...candidate, confidence: confidence(candidate.score) }));
}

function configuredProviders() {
  return {
    serpApi: Boolean(process.env.SERPAPI_API_KEY),
    barcodeLookup: Boolean(process.env.BARCODELOOKUP_API_KEY),
    goUpc: Boolean(process.env.GOUPC_API_KEY)
  };
}

async function fetchJson(url, timeoutMs = 8500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body?.message || body?.error?.message || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function lookupBarcodeLookup(query) {
  const key = process.env.BARCODELOOKUP_API_KEY;
  if (!key) return { state: 'not_configured', candidates: [] };
  const params = new URLSearchParams({ key, formatted: 'y' });
  if (isBarcode(query)) params.set('barcode', query);
  else params.set('mpn', query);
  try {
    const payload = await fetchJson(`https://api.barcodelookup.com/v3/products?${params.toString()}`);
    const products = Array.isArray(payload?.products) ? payload.products : [];
    return {
      state: products.length ? 'matched' : 'no_match',
      candidates: products.slice(0, 4).map(product => candidateFromBarcodeLookup(product, query))
    };
  } catch (error) {
    if (error?.status === 404) return { state: 'no_match', candidates: [] };
    throw error;
  }
}

async function lookupGoUpc(query) {
  const key = process.env.GOUPC_API_KEY;
  if (!key) return { state: 'not_configured', candidates: [] };
  if (!isBarcode(query)) return { state: 'not_applicable', candidates: [] };
  try {
    const payload = await fetchJson(`https://go-upc.com/api/v1/code/${encodeURIComponent(query)}?key=${encodeURIComponent(key)}`);
    const candidate = candidateFromGoUpc(payload, query);
    const valid = candidate.title && candidate.title !== 'RC part';
    return { state: valid ? 'matched' : 'no_match', candidates: valid ? [candidate] : [] };
  } catch (error) {
    if (error?.status === 404) return { state: 'no_match', candidates: [] };
    throw error;
  }
}

async function serpSearch(params) {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) return { state: 'not_configured', payload: null };
  const qp = new URLSearchParams({
    api_key: key,
    hl: 'en',
    gl: 'sa',
    google_domain: 'google.com',
    ...params
  });
  const payload = await fetchJson(`https://serpapi.com/search.json?${qp.toString()}`, 10000);
  if (payload?.error) throw new Error(payload.error);
  return { state: 'ok', payload };
}

async function lookupSerpApi(query) {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) return { state: 'not_configured', candidates: [] };
  const cleanQuery = text(query).replace(/"/g, '');
  const [shoppingResult, fctResult] = await Promise.allSettled([
    serpSearch({ engine: 'google_shopping', q: cleanQuery, device: 'mobile' }),
    serpSearch({ engine: 'google', q: `site:fcthobby.com/en "${cleanQuery}"`, num: '8' })
  ]);

  const shoppingPayload = shoppingResult.status === 'fulfilled' ? shoppingResult.value.payload : null;
  const fctPayload = fctResult.status === 'fulfilled' ? fctResult.value.payload : null;
  const shoppingRows = [
    ...(shoppingPayload?.shopping_results || []),
    ...(shoppingPayload?.inline_shopping_results || [])
  ].slice(0, 8);
  const fctRows = (fctPayload?.organic_results || []).slice(0, 6);
  let candidates = [
    ...shoppingRows.map(item => candidateFromShopping(item, query)),
    ...fctRows.map(item => candidateFromOrganic(item, query))
  ];

  // Use one broader search only when the targeted sources returned nothing useful.
  const hasLikelyMatch = candidates.some(candidate => matchQuality(candidate, query).contains);
  if (!hasLikelyMatch) {
    const general = await serpSearch({ engine: 'google', q: `"${cleanQuery}" RC part`, num: '8' });
    const rows = (general.payload?.organic_results || []).slice(0, 8);
    candidates.push(...rows.map(item => candidateFromOrganic(item, query)));
  }

  return {
    state: candidates.length ? 'matched' : 'no_match',
    candidates,
    note: candidates.length ? '' : 'Google and Google Shopping did not return a usable match.'
  };
}

function responseHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
}

function httpError(res, status, error) {
  responseHeaders(res);
  return res.status(status).json({ ok: false, error });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return httpError(res, 405, 'Use GET.');
  const raw = Array.isArray(req.query?.q) ? req.query.q[0] : req.query?.q;
  const query = text(raw).slice(0, 64);
  if (!isLikelyCode(query)) {
    return httpError(res, 400, 'Enter a barcode or manufacturer part number with at least 2 characters.');
  }

  const providers = configuredProviders();
  if (!providers.serpApi && !providers.barcodeLookup && !providers.goUpc) {
    responseHeaders(res);
    return res.status(200).json({
      ok: true,
      query,
      kind: isBarcode(query) ? 'barcode' : 'part_number',
      results: [],
      providerStatus: {
        serpApi: 'not_configured',
        barcodeLookup: 'not_configured',
        goUpc: 'not_configured'
      },
      needsConfiguration: true,
      message: 'No online data provider is connected. Add SERPAPI_API_KEY in Vercel to start live RC part lookup.'
    });
  }

  const tasks = [
    ['barcodeLookup', lookupBarcodeLookup(query)],
    ['goUpc', lookupGoUpc(query)],
    ['serpApi', lookupSerpApi(query)]
  ];
  const settled = await Promise.allSettled(tasks.map(([, task]) => task));
  const statuses = {};
  const warnings = [];
  const candidates = [];

  settled.forEach((result, index) => {
    const name = tasks[index][0];
    if (result.status === 'fulfilled') {
      statuses[name] = result.value.state;
      candidates.push(...(result.value.candidates || []));
      if (result.value.note) warnings.push(result.value.note);
    } else {
      statuses[name] = 'error';
      warnings.push(`${name} did not respond. Try again.`);
    }
  });

  const results = mergeCandidates(candidates, query);
  responseHeaders(res);
  return res.status(200).json({
    ok: true,
    query,
    kind: isBarcode(query) ? 'barcode' : 'part_number',
    results,
    providerStatus: statuses,
    needsConfiguration: false,
    message: results.length
      ? `Found ${results.length} online ${results.length === 1 ? 'match' : 'matches'}. Confirm the correct RC part before saving.`
      : 'No reliable match found. Try the printed manufacturer part number, usually shown beside the barcode.',
    warnings
  });
}

export const __test__ = {
  normalized,
  isBarcode,
  detectBrand,
  candidateFromShopping,
  candidateFromOrganic,
  candidateFromBarcodeLookup,
  mergeCandidates,
  scoreCandidate,
  confidence
};
