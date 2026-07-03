# RC Vault V10, Live SKU Lookup Engine

This is a clean rebuild of the lookup flow.

## What this version does

1. Scan a barcode using the rear camera. A valid read starts the online lookup immediately.
2. Type or paste a manufacturer part number, for example `ARA-1606`, `HPI 85615`, or a Traxxas SKU.
3. The server searches online providers and returns the best product cards inside RC Vault.
4. Confirm the result, then save it to your personal vault with quantity and storage bin.

The app does not invent a product record. It shows the source and match confidence before you save.

## Provider order

1. **Barcode Lookup**, optional. Searches UPC, EAN, GTIN, and MPN.
2. **Go-UPC**, optional. Adds a barcode-only fallback.
3. **Google Shopping through SerpApi**, required for strong RC-part coverage.
4. **FCT Hobby Saudi priority search through Google**, included in the SerpApi route.
5. A broader Google RC parts search runs only when the first online pass finds no usable match.

## Required setup for a working online lookup

Deploy this folder to Vercel, then add the environment variables in **Project Settings → Environment Variables**.

Minimum configuration:

```text
SERPAPI_API_KEY=your_key_here
```

Recommended configuration:

```text
SERPAPI_API_KEY=your_key_here
BARCODELOOKUP_API_KEY=your_key_here
GOUPC_API_KEY=your_key_here
```

`SERPAPI_API_KEY` is the key that makes this an RC-parts lookup engine. It returns Google Shopping cards plus FCT-priority search results. The other two services strengthen exact barcode results.

Do not place any key in `index.html`. The Vercel API route keeps keys server-side.

## Deployment steps

1. Unzip the package.
2. Open Vercel and import the folder or GitHub repository.
3. Add the environment variables above.
4. Deploy again.
5. Open `https://your-project.vercel.app/api/health`.
6. You should see `"serpApi": true` when the main source is connected.
7. Open the app from that Vercel link, not by double-clicking `index.html` on your computer.

## Camera workflow

- Grant camera permission when asked.
- Use **Scan barcode**. A successful read vibrates and starts lookup automatically.
- Use **Capture and read** when a glossy, tiny, or curved label does not scan continuously.
- Use **Scan photo** for a saved close-up of a barcode.
- Printed part numbers are text, not barcodes. Enter them in the main lookup field unless you have an OCR provider connected.

## Important boundaries

- The app does not scrape FCT Hobby or other retailer websites.
- Live product data needs a configured provider. Without a provider key, the app shows the configuration message instead of a fake match.
- Results can still be incomplete. Confirm part number and fitment before saving to inventory.

## Local inventory

Your saved parts live in the browser on the device. Use **Export CSV** regularly as a backup. Cloud sync can be added after the lookup engine is proven in real use.

## Smoke tests

```bash
npm run check
npm test
```
