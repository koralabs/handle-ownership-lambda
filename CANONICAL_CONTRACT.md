# handle-ownership-lambda canonical contract

I am a read-only daily monitor. I walk all Handles and check that a personalized Handle still owns its background and profile-picture assets and that its published image matches the image rendered from its data. I only report (`NOTIFY` logs).

1. **I never sign or submit a transaction and hold no private key.** The "reset handle" steps are TODO.
2. **Trust comes only from the on-chain `pz_settings` datum.** Admin credentials are read from field six of the datum, in order; an empty list trusts nobody; a malformed datum is an error, never an empty success.
3. **A Handle validated by an admin credential, or served by an approved personalization script hash, is skipped; every other Handle is checked.**
4. **Policy id and settings handle name are exact** (`src/configs/index.ts`); changing them changes which assets count as Handles.
5. **A failed read is an error for that Handle, never a pass.** No resolved address or a failed lookup returns `Err`, not `Ok`.
6. **Mismatches are logged `NOTIFY`, never silently dropped.**
