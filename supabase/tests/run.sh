#!/usr/bin/env bash
# Applies all migrations to a throwaway database on a local Postgres (15+)
# using shim.sql in place of Supabase's auth/storage schemas, then runs
# rls_test.sql. Usage: PGHOST=... PGPORT=... PGUSER=postgres supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${TEST_DB:-tailor_test}"
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
run() { psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$1" >/dev/null; }
run tests/shim.sql
for f in migrations/*.sql; do run "$f"; done
psql -v ON_ERROR_STOP=1 -d "$DB" -f tests/rls_test.sql
echo "database tests passed"
