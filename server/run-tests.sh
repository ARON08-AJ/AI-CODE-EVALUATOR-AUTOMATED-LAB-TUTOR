#!/bin/bash
set -e

function run_test() {
  TEST_FILE=$1
  echo "--- RUNNING $TEST_FILE ---"
  kill -9 $(lsof -t -i :3000) 2>/dev/null || true
  npm run dev > dev.log 2>&1 &
  DEV_PID=$!
  sleep 4
  npx tsx $TEST_FILE || { echo "$TEST_FILE FAILED"; kill -9 $DEV_PID; exit 1; }
  kill -9 $DEV_PID
}

run_test test-phase8.ts
run_test test-phase9.ts
run_test test-phase10.ts
run_test test-phase11.ts
run_test test-phase12.ts
run_test test-phase13.ts
run_test test-phase14.ts

echo "ALL TESTS PASSED"
