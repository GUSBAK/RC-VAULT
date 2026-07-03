# RC Vault V11 · reliable online SKU lookup

## What V11 fixes

V10 treated the presence of an environment-variable value as a live connection. A missing, expired, copied incorrectly, or over-quota key could therefore show as “connected” while every lookup failed.

V11 validates the two primary providers before lookup:

- **Google via SerpApi**: checks the SerpApi account endpoint. This does not consume a search credit.
- **Barcode Lookup**: checks the official rate-limit endpoint. This does not consume a product lookup.
- **Go-UPC**: reports as configured until the first UPC or EAN request, because it does not expose a no-cost account-health endpoint in this package.

It gives a clear failure reason inside the app, such as `invalid key`, `quota exceeded`, `timeout`, or `not configured`.

## Important: the 101211 scan

`101211` is a **manufacturer part number**, not a UPC or EAN barcode. It is HPI Racing #101211, **Rod End Set**, for the Bullet Series. V11 has an exact HPI official resolver at:

`https://www.hpiracing.com/en/part/101211`

This official HPI resolver runs without any API key for HPI numeric part numbers. The app returns the title, brand, series, fitment, official product link, and availability when HPI returns it.

## Live data sources for all brands

Set these in Vercel: **Project → Settings → Environment Variables**, then redeploy.

```text
SERPAPI_API_KEY=your_real_key
BARCODELOOKUP_API_KEY=your_real_key
GOUPC_API_KEY=your_real_key
```

Only SerpApi is necessary for a practical first setup. Barcode Lookup and Go-UPC add UPC, EAN, GTIN, and MPN coverage.

V11 uses the following order:

1. Exact HPI official page for HPI numeric part numbers.
2. Barcode Lookup for UPC, EAN, GTIN, or MPN.
3. Go-UPC for UPC and EAN values.
4. One exact Google search through SerpApi. This avoids using two search credits per scan. It gives FCT Hobby Saudi priority whenever FCT appears in the online results.
5. Google Shopping only when the exact Google results do not show a useful product match.

## Use the built-in connection test

After deployment, open RC Vault. The yellow or red notice at the top lists each provider and its exact status. Tap **Run connection test** after replacing a key.

A valid setup will say `ready`, not merely `configured`.

## Deploy

1. Extract the zip.
2. Upload all extracted files to the root of your Vercel project.
3. Add your environment variables.
4. Redeploy.
5. Fully close the installed iPhone web app, then reopen it.

## Local data

Your saved vault records stay in the browser on that device. Export CSV regularly from **My vault**.
