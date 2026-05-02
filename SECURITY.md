# Security

## `npm audit` status

This repo is a read-only library comparison. It takes no untrusted input —
it just calls public Solana RPC endpoints and counts tokens in its own
source files. That shapes the security posture below.

### Why we override `uuid`

Several transitive dependencies still pull old `uuid` releases that have
published CVEs. We pin `uuid` to `^14.0.0` via `npm overrides` in
`package.json`.

That's safe here because the parts of the `uuid` API those deps actually
use (`v4` UUIDs, parse, stringify) have been stable from v3 through v14,
so forcing the modern version doesn't change runtime behaviour — it just
removes the audit noise.

This takes `npm audit` from 17 issues down to 4.

### Why 4 audit warnings remain (and why we're leaving them)

The remaining 4 high-severity warnings are all rooted in
[`bigint-buffer`](https://www.npmjs.com/package/bigint-buffer):

```
bigint-buffer
└── @solana/buffer-layout-utils
    └── @solana/spl-token
        └── @solana-developers/helpers
```

There is no fixed version of `bigint-buffer`:

- The maintainer hasn't published a release since **October 2019**.
- The transitive parent `@solana/buffer-layout-utils` was **archived
  by Solana Labs in January 2025**.

The advisory ([GHSA-3gc7-fjrx-p6mg](https://github.com/advisories/GHSA-3gc7-fjrx-p6mg))
is a buffer-overflow / DoS triggered by passing a hand-crafted input to
`toBigIntLE()`. In this repository's code paths we only feed it values
returned by Solana RPC, never attacker-controlled input, so it isn't
exploitable here.

We are deliberately **not** doing the following:

- ❌ Adding an `overrides` entry for `bigint-buffer`. There is nothing
  to point it at.
- ❌ Pulling in a third-party fork such as `bigint-buffer-safe`. An
  unreviewed replacement maintained by a single anonymous account is a
  worse supply-chain risk than a known, scoped CVE we already
  understand.
- ❌ Running `npm audit fix --force`. It downgrades
  `@solana-developers/helpers` to an older breaking version and
  doesn't actually fix the root cause.

### Checklist for future maintainers

When you next touch dependencies, please re-check the following — the
goal is to delete this whole section once the ecosystem moves on:

- [ ] Has `bigint-buffer` published a fixed release? If yes, drop the
      remaining audit warnings should disappear automatically once deps
      update.
- [ ] Has the project finished migrating off `@solana/web3.js` v1 and
      `@solana/buffer-layout-utils` (i.e. is everything Solana Kit
      now)? If yes, the `bigint-buffer` chain goes away entirely.
- [ ] Do all the libraries we still compare against expose modern
      `uuid` versions natively? If yes, the `overrides` block in
      `package.json` can be removed.

Once all three are true, delete the override, delete this section, and
celebrate.
