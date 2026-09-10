# Data model

The tables match the build spec: categories, capabilities, test scenarios, test runs, test results, capability changes, capability requests, and sources.

Added for the product: product events, rate-limit buckets, scout findings, and a retest queue.

Public visitors can read published rows only. Request inserts go through `submit_capability_request`.
