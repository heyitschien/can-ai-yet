# Can AI Yet?

We test real work so you don’t have to guess.

A visitor can search a task, open the closest tested capability, see a score that came from the laboratory, read what failed, and request a test we have not run.

## Local

```bash
pnpm install
pnpm eval all
pnpm dev
```

Copy `.env.example` to `.env.local` before using the request form or admin.

## Commands

```bash
pnpm eval capability CAP-001
pnpm eval scenario LEAD-003
pnpm eval all
pnpm eval all --persist
```

`--persist` writes evidence. It does not spend model money. Frontier-model runs are not automatic.
