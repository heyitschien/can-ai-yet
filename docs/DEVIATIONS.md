# Deviations

- Published scores are from a deterministic reference agent, not a frontier model. The provider field says so. No model score was invented.
- `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are required because the spec listed only `ADMIN_EMAIL`.
- Request inserts use a tightly scoped database function so the public form works without exposing the service key to the browser.
- Extra tables: `product_events`, `rate_limit_buckets`, `scout_findings`, `retest_queue`. Extra routes: `/privacy`, `/api/health`.
- Spreadsheet fixtures are in-memory CSV rows, not XLSX files.
- Embeddings are deferred. Search is lexical and works if the model API is down.
- The first remote migration was an empty marker; the schema lives in the later applied migrations and in `supabase/migrations/20260910213000_init.sql`.
