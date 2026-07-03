# RC Vault V12 · brand-aware parts lookup and searchable vault

## What changed

### Better lookup for XRAY and other brands

A bare numeric part number is not unique across the RC world. V12 therefore adds a **Brand** selector before every lookup.

- Select **XRAY** before checking an XRAY numeric part number, such as `301025`.
- Select **HPI Racing** before checking an HPI number, such as `101211`.
- Select **Auto** for UPC, EAN, GTIN, or part numbers that carry an unmistakable prefix, such as `ARA-1606`.

V12 uses:

1. Direct HPI official resolver for HPI part numbers.
2. Direct XRAY official route only when **XRAY** is selected.
3. Barcode Lookup and Go-UPC for barcode coverage when their keys are present.
4. Brand-aware Google and Google Shopping searches through SerpApi for Traxxas, ARRMA, Axial, Losi, Team Associated, Tamiya, Kyosho, Maverick, and any part not matched by an official route.

This prevents the old system from treating a numeric XRAY number as an unknown generic code or, worse, an unrelated HPI part.

## New inventory features

- Manual **Price, SAR** field.
- Stored **Product link** field.
- Click a saved part to open a details screen.
- Click the product name or image in lookup results to open its online listing.
- Search My Vault by **brand**, **car name/platform**, **part number**, **barcode**, or any keyword.
- CSV export now includes car name, price in SAR, and product link.
- V12 migrates local records from V10 and V11 automatically on the same device.

## Environment variables

Add your keys in Vercel under **Project → Settings → Environment Variables**, then redeploy:

```text
SERPAPI_API_KEY=your_real_key
BARCODELOOKUP_API_KEY=your_real_key
GOUPC_API_KEY=your_real_key
```

Only SerpApi is needed for wide, brand-aware online coverage. Barcode Lookup and Go-UPC help with UPC, EAN, and GTIN labels.

## Deploy

1. Extract the ZIP.
2. Upload the extracted files to the root of your Vercel project.
3. Add environment variables.
4. Redeploy.
5. Open the new deployment in Safari.
6. Delete the old Home Screen RC Vault icon and add the new one again.

The header must show **V12.0**. This confirms the installed copy is current.

## Important usage note

Use **brand selection** for labels that provide only a number. The app cannot safely know whether an unbranded six-digit number belongs to XRAY, HPI, Traxxas, or another manufacturer without a barcode database match or a brand clue.
