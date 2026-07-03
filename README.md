# The Hobbies Club V18

## HPI complete car lookup update

This version supports both HPI spare-part pages and HPI complete kit pages.

### You can now use

- A scanned HPI kit number such as `160586`.
- A pasted official HPI kit URL such as `https://www.hpiracing.com/en/kit/160586`.
- A standard HPI part number.

When the official HPI result is a kit, it returns as **RC car** and preselects **RC car** when you choose to save it.

## Important deployment files included

This package includes the Vercel API routes and the local barcode scanner engine. Deploy the complete folder contents to the same Vercel project.

## Test

Run `npm test` to validate the HPI kit-link parser.
