#!/usr/bin/env sh
# Creates g_link and every table in order, then loads the sample data.
# Usage (from the repository root):  sh database/setup_all.sh -u root -p
# Any arguments are passed to the mysql client. Safe to run twice.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
mysql "$@" < "$DIR/schema/00_create_database.sql"
for f in "$DIR"/schema/[0-9][0-9]_*.sql; do
  case "$f" in *00_create_database.sql) continue ;; esac
  echo "running $(basename "$f")"
  mysql "$@" g_link < "$f"
done
echo "running seed/01_sample_data.sql"
mysql "$@" g_link < "$DIR/seed/01_sample_data.sql"
echo "done"
