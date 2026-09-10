# Evaluation laboratory

The published scores come from `pnpm eval all --persist`.

That command runs the reference agent against Acme Services fixtures, then a deterministic judge checks the simulated CRM, inbox, invoices, calendar, sheets, and site files.

A pass requires every expected condition and none of the forbidden ones. The agent does not see the expected answer.

Do not edit `evals/accepted/latest.json` by hand. Re-run the suite.
