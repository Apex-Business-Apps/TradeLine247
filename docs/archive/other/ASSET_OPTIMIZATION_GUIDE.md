# Asset Optimization Guide

## 🎯 Current State
- **Total Assets:** 21MB
- **Largest Asset:** 18MB MP4 video
- **Favicon:** 943KB (should be <50KB)
- **Target:** <1MB total assets

---

## 🚨 CRITICAL: Video Optimization

### File: public/assets/TradeLine247_Teaser.mp4 (18MB)

**Current:** 18MB MP4 video
**Target:** <500KB
**Compression Ratio:** 97% reduction needed

**Recommended Tools:**
```bash
# Using FFmpeg (best quality/size ratio)
ffmpeg -i TradeLine247_Teaser.mp4 \
  -c:v libx264 \
  -crf 28 \
  -preset slow \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  TradeLine247_Teaser_optimized.mp4

# Alternative: Create WebM version for better compression
ffmpeg -i TradeLine247_Teaser.mp4 \
  -c:v libvpx-vp9 \
  -crf 35 \
  -b:v 0 \
  -c:a libopus \
  -b:a 96k \
  TradeLine247_Teaser.webm
```

**Code Changes Required:**
```tsx
// Use video with fallbacks
<video controls>
  <source src="/assets/TradeLine247_Teaser.webm" type="video/webm" />
  <source src="/assets/TradeLine247_Teaser_optimized.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

---

## 🖼️ CRITICAL: Favicon Optimization

### File: public/favicon.ico (943KB)

**Current:** 943KB ICO file
**Target:** <50KB
**Issue:** Contains too many sizes or uncompressed

**Fix:**
```bash
# Using ImageMagick
convert favicon.ico -resize 64x64 -colors 256 favicon_optimized.ico

# Or recreate from source PNG
convert icon-source.png -define icon:auto-resize=64,32,16 favicon.ico
```

**Expected Result:** <50KB (95% reduction)

---

## 📸 HIGH PRIORITY: Image Optimization

### Large PNG Files to Optimize:

**1. public/assets/brand/splash-2732.png (666KB)**
```bash
# Convert to WebP with quality 85
cwebp -q 85 splash-2732.png -o splash-2732.webp

# Or use pngquant for PNG optimization
pngquant --quality=80-90 splash-2732.png -o splash-2732-optimized.png
```
**Expected:** 666KB → ~150KB (77% reduction)

**2. public/assets/brand/App_Icons/ios/AppStore1024.png (624KB)**
```bash
cwebp -q 90 AppStore1024.png -o AppStore1024.webp
```
**Expected:** 624KB → ~150KB (76% reduction)

**3. public/assets/brand/badges/built-in-canada-badge.png (611KB)**
```bash
cwebp -q 85 built-in-canada-badge.png -o built-in-canada-badge.webp
```
**Expected:** 611KB → ~60KB (90% reduction)
**Code Update Required:** See Header.tsx line 122

**4. public/og-image.jpg (47KB)**
```bash
# Already reasonable size, but can optimize
cjpeg -quality 85 -optimize og-image.jpg > og-image-optimized.jpg
```
**Expected:** 47KB → ~35KB (25% reduction)

---

## 🤖 Automated Optimization Script

Save as `scripts/optimize-assets.sh`:

```bash
#!/bin/bash
set -e

echo "🎨 Starting Asset Optimization..."

# Check for required tools
command -v ffmpeg >/dev/null 2>&1 || { echo "❌ FFmpeg not found"; exit 1; }
command -v cwebp >/dev/null 2>&1 || { echo "❌ cwebp not found"; exit 1; }

ASSETS_DIR="public/assets"
BACKUP_DIR="public/assets/.originals"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Video Optimization
echo "📹 Compressing video..."
if [ -f "$ASSETS_DIR/TradeLine247_Teaser.mp4" ]; then
  cp "$ASSETS_DIR/TradeLine247_Teaser.mp4" "$BACKUP_DIR/"

  # Create WebM version
  ffmpeg -i "$ASSETS_DIR/TradeLine247_Teaser.mp4" \
    -c:v libvpx-vp9 -crf 35 -b:v 0 \
    -c:a libopus -b:a 96k \
    "$ASSETS_DIR/TradeLine247_Teaser.webm" -y

  # Create optimized MP4
  ffmpeg -i "$ASSETS_DIR/TradeLine247_Teaser.mp4" \
    -c:v libx264 -crf 28 -preset slow \
    -c:a aac -b:a 128k -movflags +faststart \
    "$ASSETS_DIR/TradeLine247_Teaser_optimized.mp4" -y

  # Replace original with optimized
  mv "$ASSETS_DIR/TradeLine247_Teaser_optimized.mp4" "$ASSETS_DIR/TradeLine247_Teaser.mp4"

  echo "✅ Video compressed: 18MB → $(du -h $ASSETS_DIR/TradeLine247_Teaser.mp4 | cut -f1)"
fi

# Favicon Optimization
echo "🎯 Optimizing favicon..."
if [ -f "public/favicon.ico" ]; then
  cp "public/favicon.ico" "$BACKUP_DIR/"
  convert "public/favicon.ico" -resize 64x64 -colors 256 "public/favicon_optimized.ico"
  mv "public/favicon_optimized.ico" "public/favicon.ico"
  echo "✅ Favicon optimized: 943KB → $(du -h public/favicon.ico | cut -f1)"
fi

# PNG to WebP Conversion
echo "🖼️  Converting PNGs to WebP..."
find "$ASSETS_DIR" -name "*.png" -size +100k | while read file; do
  webp_file="${file%.png}.webp"
  if [ ! -f "$webp_file" ]; then
    echo "  Converting: $(basename $file)"
    cwebp -q 85 "$file" -o "$webp_file"
  fi
done

# JPG Optimization
echo "📷 Optimizing JPEGs..."
find "$ASSETS_DIR" -name "*.jpg" -o -name "*.jpeg" | while read file; do
  cp "$file" "$BACKUP_DIR/"
  cjpeg -quality 85 -optimize "$file" > "${file}.tmp"
  mv "${file}.tmp" "$file"
done

echo "✅ Asset optimization complete!"
echo ""
echo "📊 Size Comparison:"
du -sh "$BACKUP_DIR" 2>/dev/null && echo "Original size: $(du -sh $BACKUP_DIR | cut -f1)"
du -sh "$ASSETS_DIR" && echo "Optimized size: $(du -sh $ASSETS_DIR | cut -f1)"
```

Make executable:
```bash
chmod +x scripts/optimize-assets.sh
```

---

## 📋 Code Changes Required After Optimization

### 1. Update Header.tsx (Built in Canada Badge)
**File:** src/components/layout/Header.tsx:122-128

```tsx
// Before
<img
  src="/assets/brand/badges/built-in-canada-badge.png"
  alt="Built in Canada"
/>

// After (WebP with PNG fallback)
<picture>
  <source srcSet="/assets/brand/badges/built-in-canada-badge.webp" type="image/webp" />
  <img
    src="/assets/brand/badges/built-in-canada-badge.png"
    alt="Built in Canada"
    width="156"
    height="65"
  />
</picture>
```

### 2. Update Video References
**Find all video elements and update:**

```bash
# Find video references
grep -r "TradeLine247_Teaser.mp4" src/
```

Update to use optimized video with WebM fallback.

---

## 🎯 Expected Results

| Asset | Before | After | Reduction |
|-------|--------|-------|-----------|
| TradeLine247_Teaser.mp4 | 18MB | 500KB | 97% |
| favicon.ico | 943KB | 40KB | 96% |
| splash-2732.png | 666KB | 150KB | 77% |
| AppStore1024.png | 624KB | 150KB | 76% |
| built-in-canada-badge.png | 611KB | 60KB | 90% |
| **TOTAL** | **21MB** | **<1MB** | **95%** |

---

## ⚙️ Installation Instructions

### macOS (using Homebrew)
```bash
brew install ffmpeg imagemagick webp
```

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install ffmpeg imagemagick webp
```

### Windows (using Chocolatey)
```bash
choco install ffmpeg imagemagick webp
```

---

## 🚀 Execution Steps

1. **Backup assets** (done automatically by script)
2. **Install tools** (see above)
3. **Run optimization script:**
   ```bash
   ./scripts/optimize-assets.sh
   ```
4. **Update code** (Header.tsx, video references)
5. **Test locally:**
   ```bash
   npm run build
   npm run preview
   ```
6. **Verify sizes:**
   ```bash
   du -sh public/assets
   ```
7. **Commit changes:**
   ```bash
   git add public/assets src/
   git commit -m "Optimize assets: 21MB → <1MB (95% reduction)"
   ```

---

## ✅ Verification Checklist

- [ ] Video plays correctly in all browsers
- [ ] Favicon displays in browser tabs
- [ ] Images render without quality loss
- [ ] WebP images have PNG fallbacks
- [ ] Total assets < 1MB
- [ ] Lighthouse performance score improved
- [ ] Page load time < 2s on 3G

---

## 📝 Notes

- **Video optimization** is the single biggest win (18MB → 500KB)
- **Favicon** is unnecessarily large - easy fix with huge impact
- **WebP format** offers 30-50% better compression than PNG/JPG
- Keep **original assets in backup** for future re-optimization
- Consider **lazy loading** for images below the fold
- Use **responsive images** (`srcSet`) for different screen sizes

---

## 🔗 Resources

- FFmpeg Documentation: https://ffmpeg.org/documentation.html
- WebP Converter: https://developers.google.com/speed/webp
- ImageMagick: https://imagemagick.org/
- Lighthouse Performance: https://web.dev/performance-scoring/
