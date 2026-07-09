#!/bin/bash
# Assembles all section files into brochure.html
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cat \
  "$SCRIPT_DIR/_head.html" \
  "$SCRIPT_DIR/sections/01-cover.html" \
  "$SCRIPT_DIR/sections/02-about.html" \
  "$SCRIPT_DIR/sections/03-programme-day1.html" \
  "$SCRIPT_DIR/sections/05-registration.html" \
  "$SCRIPT_DIR/sections/07-partnership.html" \
  "$SCRIPT_DIR/sections/09-back-cover.html" \
  "$SCRIPT_DIR/_foot.html" \
  > "$SCRIPT_DIR/brochure.html"
echo "Built brochure.html"
