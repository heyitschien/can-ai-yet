# Architecture

The public site is a Next.js app. Postgres is the source of truth for published capabilities. The laboratory produces an evidence file, and the seed writes that evidence into the database.

Search is lexical and does not require a model. `/api/ask` explains stored records and falls back to a template if no model key is set.

Cron routes only queue review work. They do not spend model money.
