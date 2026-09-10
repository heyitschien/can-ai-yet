# Operations

Set the variables in `.env.example` on Vercel. Do not commit them.

Weekly scout and monthly retest are protected by `CRON_SECRET`. They queue review items. They do not call a model.

To publish a new accepted run:

1. Freeze the fixture.
2. Run `pnpm eval all --persist`.
3. Inspect failures.
4. Seed the database from the evidence file.
5. Deploy.

Preview deployments should not overwrite production benchmark rows.
