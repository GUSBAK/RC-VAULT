const RC_KEYWORDS = [
  ['Traxxas', /\b(traxxas|trx[-\s]?\d+|tra\d+)\b/i],
  ['ARRMA', /\b(arrma|ara[-\s]?\d+|arac\d+)\b/i],
  ['HPI Racing', /\b(hpi|hpiracing|hpi racing|bullet series)\b/i],
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
  FCT_DOMAIN,
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
  return [...new Set([clean, compact].filter(Boolean))];
}

function isBarcode(value = '') {
  return /^\d{7,14}$/.test(text(value));
}

function isLikelyCode(value = '') {
  return /^[A-Za-z0-9][A-Za-z0-9._\-/ ]{1,63}$/.test(text(value));
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
  if (h === 'hpiracing.com' || h.endsWith('.hpiracing.com')) return 'HPI Racing official';
  if (h === 'arrma-rc.com' || h.endsWith('.arrma-rc.com')) return 'ARRMA official';
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
  if (/shock|spring|arm|suspension|hub|c-hub|knuckle|link set|rod end/.test(v)) return 'Suspension';
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

function decodeHtml(value = '') {
  return text(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripHtml(value = '') {
  return decodeHtml(String(value ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' '));
}

function htmlMeta(html = '', key = '') {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i')
  ];
  for (const pattern of patterns) {
    const match = String(html).match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return '';
}

function htmlHeading(html = '', tag = 'h1') {
  const match = String(html).match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? stripHtml(match[1]) : '';
}

function firstListAfter(html = '', headingPattern = /This Part Fits/i, limit = 8) {
  const source = String(html);
  const heading = source.search(headingPattern);
  if (heading < 0) return [];
  const window = source.slice(heading, heading + 16000);
  const listMatch = window.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
  if (!listMatch) return [];
  return [...listMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map(match => stripHtml(match[1]))
    .filter(Boolean)
    .slice(0, limit);
}

function hpiCode(query = '') {
  const value = text(query).toUpperCase().replace(/^HPI[-\s]?/i, '').replace(/[^A-Z0-9]/g, '');
  return /^\d{4,8}$/.test(value) ? value : '';
}

function extractAvailability(html = '') {
  const source = stripHtml(html);
  if (/\bIn stock\b/i.test(source)) return 'In stock';
  if (/\bOut of stock\b/i.test(source)) return 'Out of stock';
  return '';
}

function matchQuality(candidate, query) {
  const qTokens = codeTokens(query).map(normalized);
  const fields = [candidate.barcode, candidate.partNumber, candidate.sku, candidate.title, candidate.description, candidate.fitment]
    .map(value => normalized(value));
  const exact = qTokens.some(token => token && fields.some(field => field === token));
  const contains = qTokens.some(token => token && fields.some(field => field.includes(token)));
  return { exact, contains };
}

function scoreCandidate(candidate, query) {
  const { exact, contains } = matchQuality(candidate, query);
  let score = 0;
  if (candidate.provenance?.includes('HPI official')) score += 93;
  if (candidate.provenance?.includes('Barcode Lookup') || candidate.provenance?.includes('Go-UPC')) score += 90;
  if (exact) score += 75;
  else if (contains) score += 42;
  if (candidate.brand) score += 5;
  if (candidate.imageUrl) score += 4;
  if (candidate.description) score += 3;
  if (candidate.fitment) score += 4;
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
    fitment: text(raw.fitment),
    category: text(raw.category),
    imageUrl: safeUrl(raw.imageUrl || raw.image || raw.thumbnail || raw.image_url),
    sources: Array.isArray(raw.sources) ? raw.sources : [],
    provenance: Array.isArray(raw.provenance) ? raw.provenance : []
  };
  candidate.title = titleWithoutRetailer(candidate.title) || candidate.partNumber || candidate.barcode || 'RC part';
  candidate.brand ||= detectBrand(candidate.title, candidate.description, candidate.partNumber, candidate.fitment);
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

function queryInText(query, ...values) {
  const token = normalized(query);
  if (!token) return false;
  return values.some(value => normalized(value).includes(token));
}

function candidateFromOrganic(item, query) {
  const url = safeUrl(item?.link || item?.url || '');
  const title = text(item?.title);
  const snippet = text(item?.snippet);
  const exactCode = queryInText(query, title, snippet) ? query : '';
  return sanitizeCandidate({
    title,
    brand: detectBrand(title, snippet, query),
    partNumber: !isBarcode(query) ? exactCode : '',
    barcode: isBarcode(query) ? exactCode : '',
    description: snippet,
    imageUrl: item?.thumbnail || item?.favicon,
    sources: [{
      supplier: sourceLabel(url),
      url,
      price: '',
      currency: '',
      availability: '',
      sourceType: 'Google exact search'
    }],
    provenance: ['Google Search']
  });
}

function candidateFromShopping(item, query) {
  const url = safeUrl(item?.link || item?.product_link || item?.productLink || '');
  const title = text(item?.title);
  const exactCode = queryInText(query, title, item?.snippet) ? query : '';
  return sanitizeCandidate({
    title,
    brand: detectBrand(title, query),
    partNumber: !isBarcode(query) ? exactCode : '',
    barcode: isBarcode(query) ? exactCode : '',
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
    if (!existing.fitment && candidate.fitment) existing.fitment = candidate.fitment;
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

function providerError(error, fallback = 'Provider request failed.') {
  const status = Number(error?.status || 0);
  const raw = text(error?.message || fallback);
  if (error?.name === 'AbortError') return { state: 'timeout', detail: 'Timed out. Try again.' };
  if ([401, 403].includes(status)) return { state: 'invalid_key', detail: 'API key rejected. Replace it in Vercel, then redeploy.' };
  if (status === 429) return { state: 'quota_exceeded', detail: 'Request limit reached. Check the provider plan or wait, then retry.' };
  if (status === 404) return { state: 'no_match', detail: 'No record found.' };
  return { state: 'error', detail: raw.slice(0, 140) || fallback };
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
      const error = new Error(body?.message || body?.error?.message || body?.error || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHtml(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'RC-Vault/11.0 exact part lookup'
      },
      signal: controller.signal,
      redirect: 'follow'
    });
    const body = await response.text().catch(() => '');
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return { html: body, url: response.url || url };
  } finally {
    clearTimeout(timer);
  }
}

async function lookupHpiOfficial(query) {
  const code = hpiCode(query);
  if (!code) return { state: 'not_applicable', candidates: [], detail: '' };
  const url = `https://www.hpiracing.com/en/part/${encodeURIComponent(code)}`;
  try {
    const { html, url: finalUrl } = await fetchHtml(url);
    const h1 = htmlHeading(html, 'h1');
    const exactMarker = new RegExp(`#?\\s*${code}\\b`, 'i');
    if (!h1 || !exactMarker.test(h1)) return { state: 'no_match', candidates: [], detail: '' };
    const h2 = htmlHeading(html, 'h2');
    const title = h1.replace(new RegExp(`#?\\s*${code}\\s*[-–—]?\\s*`, 'i'), '').trim();
    const fitment = firstListAfter(html).join(' · ');
    const description = [h2, htmlMeta(html, 'og:description') || htmlMeta(html, 'description')].filter(Boolean).join('. ');
    const imageUrl = htmlMeta(html, 'og:image');
    const availability = extractAvailability(html);
    const candidate = sanitizeCandidate({
      title,
      brand: 'HPI Racing',
      partNumber: code,
      description: description || 'Genuine HPI Racing spare part.',
      fitment,
      imageUrl,
      sources: [{
        supplier: 'HPI Racing official',
        url: finalUrl,
        availability,
        sourceType: 'Official manufacturer'
      }],
      provenance: ['HPI official']
    });
    return { state: 'matched', candidates: [candidate], detail: 'Exact official HPI part page.' };
  } catch (error) {
    if (Number(error?.status) === 404) return { state: 'no_match', candidates: [], detail: '' };
    const mapped = providerError(error, 'Could not reach the HPI official part page.');
    return { ...mapped, candidates: [] };
  }
}

async function lookupBarcodeLookup(query) {
  const key = process.env.BARCODELOOKUP_API_KEY;
  if (!key) return { state: 'not_configured', candidates: [], detail: 'No key saved.' };
  const params = new URLSearchParams({ key, formatted: 'y' });
  if (isBarcode(query)) params.set('barcode', query);
  else params.set('mpn', query);
  try {
    const payload = await fetchJson(`https://api.barcodelookup.com/v3/products?${params.toString()}`);
    const products = Array.isArray(payload?.products) ? payload.products : [];
    return {
      state: products.length ? 'matched' : 'no_match',
      candidates: products.slice(0, 4).map(product => candidateFromBarcodeLookup(product, query)),
      detail: products.length ? '' : 'No result in Barcode Lookup.'
    };
  } catch (error) {
    const mapped = providerError(error, 'Barcode Lookup did not respond.');
    return { ...mapped, candidates: [] };
  }
}

async function lookupGoUpc(query) {
  const key = process.env.GOUPC_API_KEY;
  if (!key) return { state: 'not_configured', candidates: [], detail: 'No key saved.' };
  if (!isBarcode(query)) return { state: 'not_applicable', candidates: [], detail: 'Part number, not UPC/EAN/GTIN.' };
  try {
    const payload = await fetchJson(`https://go-upc.com/api/v1/code/${encodeURIComponent(query)}?key=${encodeURIComponent(key)}`);
    const candidate = candidateFromGoUpc(payload, query);
    const valid = candidate.title && candidate.title !== 'RC part';
    return { state: valid ? 'matched' : 'no_match', candidates: valid ? [candidate] : [], detail: valid ? '' : 'No result in Go-UPC.' };
  } catch (error) {
    const mapped = providerError(error, 'Go-UPC did not respond.');
    return { ...mapped, candidates: [] };
  }
}

async function serpSearch(params) {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) return { state: 'not_configured', payload: null, detail: 'No key saved.' };
  const qp = new URLSearchParams({
    api_key: key,
    hl: 'en',
    gl: 'sa',
    google_domain: 'google.com',
    ...params
  });
  try {
    const payload = await fetchJson(`https://serpapi.com/search.json?${qp.toString()}`, 11000);
    if (payload?.error) throw new Error(payload.error);
    if (payload?.search_metadata?.status === 'Error') throw new Error(payload?.error || 'Search engine returned an error.');
    return { state: 'ok', payload, detail: '' };
  } catch (error) {
    return { ...providerError(error, 'Google search did not respond.'), payload: null };
  }
}

async function lookupSerpApi(query) {
  if (!process.env.SERPAPI_API_KEY) return { state: 'not_configured', candidates: [], detail: 'No key saved.' };
  const cleanQuery = text(query).replace(/["<>]/g, '');
  const exactSearch = await serpSearch({
    engine: 'google',
    q: `"${cleanQuery}" RC`,
    num: '10',
    location: 'Jeddah, Saudi Arabia'
  });
  if (exactSearch.state !== 'ok') return { state: exactSearch.state, candidates: [], detail: exactSearch.detail };
  const rows = (exactSearch.payload?.organic_results || []).slice(0, 10);
  const candidates = rows.map(item => candidateFromOrganic(item, query));
  const hasExact = candidates.some(candidate => matchQuality(candidate, query).exact);
  if (hasExact) return { state: 'matched', candidates, detail: '' };

  const shoppingSearch = await serpSearch({
    engine: 'google_shopping',
    q: `${cleanQuery} RC part`,
    device: 'desktop',
    location: 'Jeddah, Saudi Arabia'
  });
  const shoppingRows = shoppingSearch.state === 'ok'
    ? [...(shoppingSearch.payload?.shopping_results || []), ...(shoppingSearch.payload?.inline_shopping_results || [])].slice(0, 8)
    : [];
  const additional = shoppingRows.map(item => candidateFromShopping(item, query));
  return {
    state: candidates.length || additional.length ? 'matched' : (shoppingSearch.state === 'ok' ? 'no_match' : shoppingSearch.state),
    candidates: [...candidates, ...additional],
    detail: shoppingSearch.state === 'ok' ? '' : shoppingSearch.detail
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
  if (!isLikelyCode(query)) return httpError(res, 400, 'Enter a barcode or manufacturer part number with at least 2 characters.');

  const tasks = [
    ['hpiOfficial', lookupHpiOfficial(query)],
    ['barcodeLookup', lookupBarcodeLookup(query)],
    ['goUpc', lookupGoUpc(query)],
    ['serpApi', lookupSerpApi(query)]
  ];
  const settled = await Promise.allSettled(tasks.map(([, task]) => task));
  const providerStatus = {};
  const providerDetails = {};
  const candidates = [];

  settled.forEach((result, index) => {
    const name = tasks[index][0];
    if (result.status === 'fulfilled') {
      providerStatus[name] = result.value.state;
      providerDetails[name] = text(result.value.detail);
      candidates.push(...(result.value.candidates || []));
    } else {
      providerStatus[name] = 'error';
      providerDetails[name] = 'Unexpected lookup error. Open diagnostics to identify the provider.';
    }
  });

  const results = mergeCandidates(candidates, query);
  const anyConfigured = Object.values(configuredProviders()).some(Boolean);
  responseHeaders(res);
  return res.status(200).json({
    ok: true,
    query,
    kind: isBarcode(query) ? 'barcode' : 'part_number',
    results,
    providerStatus,
    providerDetails,
    needsConfiguration: !anyConfigured && providerStatus.hpiOfficial !== 'matched',
    message: results.length
      ? `Found ${results.length} online ${results.length === 1 ? 'match' : 'matches'}. Confirm the part and fitment before saving.`
      : 'No reliable match found. Open diagnostics to see which provider needs attention, then try the printed manufacturer part number.',
    warnings: Object.entries(providerDetails).filter(([, value]) => value).map(([name, value]) => `${name}: ${value}`)
  });
}

export const __test__ = {
  normalized,
  isBarcode,
  detectBrand,
  candidateFromOrganic,
  candidateFromShopping,
  candidateFromBarcodeLookup,
  mergeCandidates,
  scoreCandidate,
  confidence,
  hpiCode,
  stripHtml,
  firstListAfter
};
