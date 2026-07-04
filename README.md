# The Hobbies Club V19

## Added: Gus Stuff

The Mac web app now has a third manual inventory type called **Gus Stuff**.

Choose **Add Gus Stuff** in My Vault. It uses only:

- Item name
- Brand
- Item for
- Barcode
- Category
- Sub category
- Stock
- Value in Saudi Riyals
- Local photo
- Notes

Gus Stuff hides RC-specific fields such as fitment, part number, supplier, product link, and storage bin.

## Photos

Choose a photo directly from your Mac or phone. The app stores a compressed local copy in the browser database and includes it in JSON backups.

## Deploy

Replace your existing web-project files with this version and deploy on the same Vercel project. Existing RC inventory stays available because this version uses the same local IndexedDB database.
