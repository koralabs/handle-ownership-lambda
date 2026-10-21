import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getAdminCredentialsFromPZSettingsDatum,
  getCustomDollarSymbolFromDatum,
} from '../src/utils/datum.ts';

// These are literal CBOR vectors, not values encoded by the decoder under test.
// Invariant: the monitor reads every admin credential from field six, preserving
// bytes and order. Failure: selecting another field could change who is trusted.
// Negative control: change items[5] to items[4] in the decoder; this test fails.
test('reads all admin credentials from the sixth settings field', () => {
  const first = '11'.repeat(28);
  const second = '22'.repeat(28);
  const result = getAdminCredentialsFromPZSettingsDatum(
    `86000000000082581c${first}581c${second}`,
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.data, [first, second]);
});

// Invariant: empty admin settings grant no credentials. Failure: returning a
// default credential would falsely trust a caller. Any nonempty fallback fails.
test('an empty admin list produces no trusted credentials', () => {
  const result = getAdminCredentialsFromPZSettingsDatum('86000000000080');
  assert.equal(result.ok, true);
  assert.deepEqual(result.data, []);
});

// Invariant: malformed admin settings are errors, not successful empty settings.
// Failure: swallowing a schema/decode error. Returning Ok([]) makes this fail.
test('rejects a non-list admin field and malformed CBOR', () => {
  const wrongType = getAdminCredentialsFromPZSettingsDatum('86000000000001');
  assert.equal(wrongType.ok, false);
  assert.equal(wrongType.error, 'expected ListData, got 1');
  const invalid = getAdminCredentialsFromPZSettingsDatum('ff');
  assert.equal(invalid.ok, false);
  assert.match(invalid.error, /unexpected header/);
});

const symbolKey = '54637573746f6d5f646f6c6c61725f73796d626f6c';

// Invariant: custom-dollar-symbol values remain exact integers from the third
// constructor field. Failure: wrong key/field, boolean coercion or precision loss.
// Changing the field index, key comparison, or converting through Number fails.
test('reads the named dollar-symbol setting without losing bigint precision', () => {
  const enabled = getCustomDollarSymbolFromDatum(`d879830000a1${symbolKey}01`);
  assert.equal(enabled.ok, true);
  assert.equal(enabled.data, 1n);
  const large = getCustomDollarSymbolFromDatum(
    `d879830000a1${symbolKey}1b0020000000000001`,
  );
  assert.equal(large.ok, true);
  assert.equal(large.data, 9007199254740993n);
});

// Invariant: absent is distinct from disabled (0). Failure: truthiness/defaulting
// loses explicit zero. Replacing the decoded value with value || undefined fails.
test('distinguishes an absent setting from an explicit zero', () => {
  const absent = getCustomDollarSymbolFromDatum('d879830000a0');
  assert.equal(absent.ok, true);
  assert.equal(absent.data, undefined);
  const disabled = getCustomDollarSymbolFromDatum(`d879830000a1${symbolKey}00`);
  assert.equal(disabled.ok, true);
  assert.equal(disabled.data, 0n);
});

// Invariant: non-integer values are reported as errors. Failure: treating a byte
// string as a usable setting. Returning Ok(undefined) on decode error fails.
test('rejects a non-integer dollar-symbol value', () => {
  const result = getCustomDollarSymbolFromDatum(`d879830000a1${symbolKey}40`);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'expected IntData, got #');
});
