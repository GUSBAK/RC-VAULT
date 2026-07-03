# RC Vault V15 · GCA neon blue theme and collapsible connections

## What changed

RC Vault V15 saves your inventory in **IndexedDB**, a local database inside the browser on the device running the app.

- Your parts stay on your iPhone, iPad, Mac, or computer.
- Nothing is uploaded to a cloud database by this feature.
- V13 automatically migrates V12, V11, V10, and V9 local records on the same browser and device.
- Your earlier data remains local. V13 copies it into the new local database the first time it opens.

## Backups

Inside **My vault**, V13 now includes:

- **Backup now**: creates a full JSON backup containing every saved part, price, barcode, location, notes, and product link.
- On iPhone and iPad, the app opens the Share sheet when supported. Choose **Save to Files** and save the file in a folder such as `On My iPhone/RC Vault Backups`.
- On Mac or desktop, the backup downloads as a JSON file.
- **Restore backup**: read a previous JSON backup and either merge it with the current device or replace the current local vault.
- **Undo last restore**: return to the local vault that existed before the most recent restore.
- **Weekly backup reminder**: appears when no backup exists or the last backup is at least seven days old.

The CSV export remains available for Excel reporting. CSV does not restore records. Use the JSON backup for restore.

## Important local-storage limits

Browser storage is local and private, but it can be removed if you clear browser website data, reset your device, or delete the browser profile. Do not rely on the app alone.

Create a JSON backup before major changes, before changing device, and at least once a week.

## Deploy V13

1. Extract this ZIP.
2. Replace the files in your existing Vercel project.
3. Redeploy.
4. Open the deployment in Safari.
5. Remove the old Home Screen shortcut and add the new one again.
6. Confirm the header shows **V13.0**.
7. Open **My vault**. Your existing parts should migrate automatically.
8. Tap **Backup now** after confirming the inventory.

## Online lookup

The lookup service remains unchanged. Keep your valid `SERPAPI_API_KEY` in Vercel for brand-aware Google and Shopping lookup. Barcode Lookup and Go-UPC remain optional sources for UPC, EAN, and GTIN labels.


## Direct backup download

Click **Download JSON**. On macOS, Safari saves the full JSON backup directly in the **Downloads** folder. This version does not open the macOS share sheet, so no Share extension is needed. On iPhone or iPad, the file downloads locally, then can be moved from Downloads to Files.


## What changed in V15

- Connection diagnostics are hidden by default in a collapsible panel.
- New GCA-inspired neon blue accent theme.
- Download JSON backup button remains direct to Downloads on Mac.
