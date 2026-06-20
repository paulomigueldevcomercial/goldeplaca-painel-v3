#!/bin/sh
set -eu

config_file="${GOLDEPLACA_RUNTIME_CONFIG_FILE:-/usr/share/nginx/html/env-config.js}"
backend_base_url="${GOLDEPLACA_BACKEND_BASE_URL:-${BACKEND_BASE_URL:-}}"
backend_base_url="$(printf '%s' "$backend_base_url" | sed 's#/*$##')"

escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

mkdir -p "$(dirname "$config_file")"
cat > "$config_file" <<EOF
window.__GOLDEPLACA_CONFIG__ = {
  BACKEND_BASE_URL: "$(escape_js "$backend_base_url")"
};
EOF
