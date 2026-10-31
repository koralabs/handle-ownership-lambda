# handle-ownership-lambda canonical contract

## Purpose and authority

I am a read-only monitor. Every day I walk all Handles and check that a personalized Handle still owns its background and profile-picture assets, and that its published image matches the image rendered from its data. I decide who is trusted from the `pz_settings` on-chain datum (admin credentials and approved personalization script hashes). Today I only report (`NOTIFY` logs); the "reset handle" steps in `src/main.ts` are TODO and I hold no signing power. I grant no authority to sign, submit transactions, reset or burn anything.

## Invariants (must never be violated)

1. **I never sign or submit a transaction and hold no private key.** Any future reset must be a separate, reviewed change with operator approval before it exists.
2. **Trust comes only from the on-chain `pz_settings` datum:** admin credentials are read from field six of the settings datum, in order, and an empty list trusts nobody. Malformed datums are errors, never an empty success. (Tested: `test/datum.test.mjs` with literal CBOR vectors and negative controls.)
3. **A Handle validated by an admin credential, or served by an approved personalization script hash, is skipped; every other Handle is checked.** Not covered by a test today.
4. **Policy id and settings handle name are exact** (`src/configs/index.ts`): changing them changes which assets I treat as Handles.
5. **A failed read is an error for that Handle, never a pass.** A Handle with no resolved address, or a failed lookup, returns `Err`, not `Ok`. Not covered by a test today.
6. **Mismatches are logged `NOTIFY`, not silently dropped, and the log never contains API keys.** Keys (`HANDLE_ME_API_KEY`, `BLOCKFROST_API_KEY`, `PINATA_*`) come from the environment only, never from git.
7. **I honor API rate limits** of api.handle.me, Blockfrost and the renderer; a 429 means wait the stated time. Not enforced by a shared helper here today.

## Boundaries and known limits

- Compares the IPFS CID I compute with the one the API reports; it does not verify the chain directly beyond Blockfrost address balances.
- `src/main.ts` also contains a stray `console.log` and a long commented block; fork of an upstream sync, so keep diffs small.
- Everything outside the four listed files (build config, monitor loop, tests) is ordinary review.

## Refactors needed to enforce this

- Add tests for `monitorHandle`: admin-validated skip, approved-script skip, missing asset, mismatched CID, and failed lookups returning `Err`.
- Route all HTTP calls through a rate-limit-aware helper with a test that proves it waits.
- Replace `console.log` with `Logger`.
