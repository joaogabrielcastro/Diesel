# PWA Icons Setup

## Temporary Icons

Currently using SVG placeholder icons with "DB" text.

## Generate Custom PNG Icons

### Option 1: Using Favicon Generator

1. Go to https://realfavicongenerator.net/ or https://favicon.io
2. Upload your Diesel Bar logo
3. Generate all icon sizes
4. Download and replace `icon-192.png` and `icon-512.png` in `/web/public/`

### Option 2: Using Photoshop/GIMP

1. Create 512x512 PNG with your logo
2. Save as `icon-512.png`
3. Resize to 192x192 and save as `icon-192.png`

### Option 3: Using ImageMagick (command line)

```bash
# If you have a logo.png file
convert logo.png -resize 192x192 icon-192.png
convert logo.png -resize 512x512 icon-512.png
```

## Testing PWA

1. Build: `npm run build`
2. Preview: `npm run preview`
3. Open in mobile browser
4. Look for "Add to Home Screen" prompt
