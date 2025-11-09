#!/bin/bash
set -e

echo "🎨 TradeLine 24/7 Asset Optimization"
echo "===================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required tools
check_dependencies() {
  local missing=()

  if ! command -v ffmpeg >/dev/null 2>&1; then
    missing+=("ffmpeg")
  fi

  if ! command -v cwebp >/dev/null 2>&1; then
    missing+=("cwebp (libwebp)")
  fi

  if ! command -v convert >/dev/null 2>&1; then
    missing+=("convert (ImageMagick)")
  fi

  if [ ${#missing[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required tools:${NC}"
    for tool in "${missing[@]}"; do
      echo "   - $tool"
    done
    echo ""
    echo "Installation instructions:"
    echo ""
    echo "macOS (Homebrew):"
    echo "  brew install ffmpeg imagemagick webp"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install ffmpeg imagemagick webp"
    echo ""
    echo "Windows (Chocolatey):"
    echo "  choco install ffmpeg imagemagick webp"
    echo ""
    exit 1
  fi

  echo -e "${GREEN}✅ All required tools installed${NC}"
  echo ""
}

# Create backup directory
create_backup() {
  BACKUP_DIR="public/assets/.originals-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  echo -e "${GREEN}📦 Created backup directory: $BACKUP_DIR${NC}"
  echo ""
}

# Optimize video
optimize_video() {
  local video_file="public/assets/TradeLine247_Teaser.mp4"

  if [ ! -f "$video_file" ]; then
    echo -e "${YELLOW}⚠️  Video file not found: $video_file${NC}"
    return
  fi

  echo "📹 Optimizing video..."
  local original_size=$(du -h "$video_file" | cut -f1)
  echo "   Original size: $original_size"

  # Backup original
  cp "$video_file" "$BACKUP_DIR/"

  # Create WebM version (best compression)
  echo "   Creating WebM version..."
  ffmpeg -i "$video_file" \
    -c:v libvpx-vp9 \
    -crf 35 \
    -b:v 0 \
    -c:a libopus \
    -b:a 96k \
    -y \
    "public/assets/TradeLine247_Teaser.webm" 2>&1 | grep -E "Duration|time=" | tail -1

  # Create optimized MP4 (fallback)
  echo "   Creating optimized MP4..."
  ffmpeg -i "$video_file" \
    -c:v libx264 \
    -crf 28 \
    -preset slow \
    -c:a aac \
    -b:a 128k \
    -movflags +faststart \
    -y \
    "public/assets/TradeLine247_Teaser_optimized.mp4" 2>&1 | grep -E "Duration|time=" | tail -1

  # Replace original with optimized
  mv "public/assets/TradeLine247_Teaser_optimized.mp4" "$video_file"

  local new_size=$(du -h "$video_file" | cut -f1)
  local webm_size=$(du -h "public/assets/TradeLine247_Teaser.webm" | cut -f1)

  echo -e "${GREEN}   ✅ Video optimized:${NC}"
  echo "      MP4:  $original_size → $new_size"
  echo "      WebM: $webm_size"
  echo ""
}

# Optimize favicon
optimize_favicon() {
  local favicon="public/favicon.ico"

  if [ ! -f "$favicon" ]; then
    echo -e "${YELLOW}⚠️  Favicon not found: $favicon${NC}"
    return
  fi

  echo "🎯 Optimizing favicon..."
  local original_size=$(du -h "$favicon" | cut -f1)
  echo "   Original size: $original_size"

  # Backup original
  cp "$favicon" "$BACKUP_DIR/"

  # Optimize (32x32 and 16x16 only, 256 colors)
  convert "$favicon" \
    -resize 64x64 \
    -colors 256 \
    "public/favicon_optimized.ico"

  mv "public/favicon_optimized.ico" "$favicon"

  local new_size=$(du -h "$favicon" | cut -f1)
  echo -e "${GREEN}   ✅ Favicon optimized: $original_size → $new_size${NC}"
  echo ""
}

# Optimize images to WebP
optimize_images() {
  echo "🖼️  Converting images to WebP..."

  local count=0
  local total_saved=0

  # Find large PNG/JPG files (>100KB)
  while IFS= read -r -d '' file; do
    local original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")

    if [ $original_size -gt 102400 ]; then  # > 100KB
      local webp_file="${file%.*}.webp"

      # Skip if WebP already exists and is newer
      if [ -f "$webp_file" ] && [ "$webp_file" -nt "$file" ]; then
        continue
      fi

      echo "   Converting: $(basename $file)"

      # Backup original
      cp "$file" "$BACKUP_DIR/"

      # Convert to WebP
      cwebp -q 85 "$file" -o "$webp_file" 2>&1 | grep -v "^Saving"

      local webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file")
      local saved=$((original_size - webp_size))
      total_saved=$((total_saved + saved))
      count=$((count + 1))

      echo "      $(numfmt --to=iec $original_size) → $(numfmt --to=iec $webp_size) (saved $(numfmt --to=iec $saved))"
    fi
  done < <(find public/assets -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -print0)

  if [ $count -gt 0 ]; then
    echo -e "${GREEN}   ✅ Converted $count images, saved $(numfmt --to=iec $total_saved)${NC}"
  else
    echo "   No large images to convert"
  fi
  echo ""
}

# Optimize existing JPGs/PNGs
optimize_existing() {
  echo "📷 Optimizing existing JPGs/PNGs..."

  local count=0

  # Optimize JPGs
  while IFS= read -r -d '' file; do
    echo "   Optimizing: $(basename $file)"
    cp "$file" "$BACKUP_DIR/"

    # Use ImageMagick to optimize
    convert "$file" -quality 85 -strip "${file}.tmp"
    mv "${file}.tmp" "$file"

    count=$((count + 1))
  done < <(find public/assets -type f \( -name "*.jpg" -o -name "*.jpeg" \) -print0)

  if [ $count -gt 0 ]; then
    echo -e "${GREEN}   ✅ Optimized $count JPG files${NC}"
  fi
  echo ""
}

# Generate optimization report
generate_report() {
  echo "📊 Generating optimization report..."
  echo ""

  local backup_size=$(du -sh "$BACKUP_DIR" | cut -f1)
  local current_size=$(du -sh public/assets | cut -f1)

  echo "╔════════════════════════════════════════╗"
  echo "║  ASSET OPTIMIZATION REPORT             ║"
  echo "╚════════════════════════════════════════╝"
  echo ""
  echo "Original size:  $backup_size (backed up)"
  echo "Optimized size: $current_size"
  echo ""
  echo "Backup location: $BACKUP_DIR"
  echo ""
  echo -e "${GREEN}✅ Optimization complete!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Test the website to ensure all assets load correctly"
  echo "2. Update code to use WebP with fallbacks (see ASSET_OPTIMIZATION_GUIDE.md)"
  echo "3. Commit changes: git add public/ && git commit -m 'Optimize assets'"
  echo ""
}

# Main execution
main() {
  echo "Starting asset optimization..."
  echo ""

  check_dependencies
  create_backup
  optimize_video
  optimize_favicon
  optimize_images
  optimize_existing
  generate_report
}

# Run main function
main