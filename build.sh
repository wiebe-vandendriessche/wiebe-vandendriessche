#!/usr/bin/env bash

#------------------------------------------------------------------------------
# @file
# Builds a Hugo site hosted on Vercel.
#
# Node.js dependencies are installed explicitly below: this script provisions its
# own pinned Node toolchain, so it cannot rely on the build image's install step.
#------------------------------------------------------------------------------

# Exit on error, undefined variables, or pipe failures
set -euo pipefail

build_temp_dir=""

# Perform cleanup
cleanup() {
  if [[ -n "${build_temp_dir:-}" && -d "${build_temp_dir}" ]]; then
    rm -rf "${build_temp_dir}"
  fi
}

# Register the cleanup trap
trap cleanup EXIT SIGINT SIGTERM

main() {
  # Define tool versions
  DART_SASS_VERSION=1.99.0
  GO_VERSION=1.27.1
  HUGO_VERSION=0.165.0
  NODE_VERSION=24.15.0

  # Set the build timezone
  export TZ=Europe/Brussels

  # Create and move into a temporary directory for downloads
  build_temp_dir=$(mktemp -d)
  pushd "${build_temp_dir}" > /dev/null

  # Create the local tools directory
  mkdir -p "${HOME}/.local"

  # Install Dart Sass
  echo "Installing Dart Sass ${DART_SASS_VERSION}..."
  curl -sLJO "https://github.com/sass/dart-sass/releases/download/${DART_SASS_VERSION}/dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz"
  tar -C "${HOME}/.local" -xf "dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz"
  export PATH="${HOME}/.local/dart-sass:${PATH}"

  # Install Go
  echo "Installing Go ${GO_VERSION}..."
  curl -sLJO "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz"
  tar -C "${HOME}/.local" -xf "go${GO_VERSION}.linux-amd64.tar.gz"
  export PATH="${HOME}/.local/go/bin:${PATH}"

  # Install Hugo
  echo "Installing Hugo ${HUGO_VERSION}..."
  curl -sLJO "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_linux-amd64.tar.gz"
  mkdir -p "${HOME}/.local/hugo"
  tar -C "${HOME}/.local/hugo" -xf "hugo_${HUGO_VERSION}_linux-amd64.tar.gz"
  export PATH="${HOME}/.local/hugo:${PATH}"

  # Install Node.js
  echo "Installing Node.js ${NODE_VERSION}..."
  curl -sLJO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"
  tar -C "${HOME}/.local" -xf "node-v${NODE_VERSION}-linux-x64.tar.xz"
  export PATH="${HOME}/.local/node-v${NODE_VERSION}-linux-x64/bin:${PATH}"

  # Return to the project root
  popd > /dev/null

  # Verify installations
  echo "Verifying installations..."
  echo Dart Sass: "$(sass --version)"
  echo Go: "$(go version)"
  echo Hugo: "$(hugo version)"
  echo Node.js: "$(node --version)"

  # Install Node.js dependencies. three.js is bundled into the site JS by Hugo's
  # js.Build (esbuild); nothing in node_modules is served directly.
  echo "Installing Node.js dependencies..."
  if [[ ! -f package-lock.json ]]; then
    echo "ERROR: package-lock.json is missing. Run 'npm install' locally and commit the lockfile." >&2
    exit 1
  fi
  npm ci --omit=dev --no-audit --no-fund
  echo three.js: "$(node -p "JSON.parse(require('fs').readFileSync('node_modules/three/package.json','utf8')).version")"

  # Configure Git
  echo "Configuring Git..."
  git config core.quotepath false
  if [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then
    git fetch --unshallow
  fi

  # Build the site
  echo "Building the site..."

  base_url="https://wiebevandendriessche.tech"
  if [[ "${VERCEL_ENV:-}" == "production" ]]; then
    base_url="https://${VERCEL_PROJECT_PRODUCTION_URL}"
  elif [[ "${VERCEL_GIT_COMMIT_REF:-}" == "dev" ]]; then
    base_url="https://preview.wiebevandendriessche.tech"
  elif [[ -n "${VERCEL_BRANCH_URL:-}" ]]; then
    base_url="https://${VERCEL_BRANCH_URL}"
  elif [[ -n "${VERCEL_URL:-}" ]]; then
    base_url="https://${VERCEL_URL}"
  fi

  hugo build --gc --minify --baseURL "${base_url}"
}

main "$@"