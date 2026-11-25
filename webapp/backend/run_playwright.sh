#!/usr/bin/env bash
# Wrapper invoked by the backend to run a selected subset of tests.
# The backend passes TEST_IDS, TESTS_COLLECTION and MONGO_* via the environment.
#
# Args: <type: ui|api> <playwright config path> <json output path>
set -euo pipefail

TYPE="$1"
CONFIG="$2"
JSON_OUT="$3"

# The repo needs Node 18+ (machine default is v15).
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use 18 >/dev/null 2>&1 || true
fi

cd "$REPO_ROOT"

# Headless, selected subset, into the chosen source collection.
export CI=true

# 1) Fetch just the selected tests into .generated/<type>.tests.json
npm run "fetch:$TYPE"

# 2) Run them; JSON reporter writes the machine-readable result to JSON_OUT.
PLAYWRIGHT_JSON_OUTPUT_NAME="$JSON_OUT" \
  npx playwright test --config="$CONFIG" --reporter=json
