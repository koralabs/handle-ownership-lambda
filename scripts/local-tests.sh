#!/usr/bin/env bash
# Local test run recorded by adahandle-deployments/common/test-evidence.sh (replaces the old Actions tests).
set -euo pipefail
( set -e; pnpm install --frozen-lockfile --ignore-scripts )
( set -e; pnpm exec tsc )
( set -e; pnpm test )
