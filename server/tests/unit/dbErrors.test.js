import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeDbError } from '../../src/utils/dbErrors.js';

const cases = [
  ['ECONNREFUSED', /MySQL server running/],
  ['ENOTFOUND', /DB_HOST/],
  ['ER_ACCESS_DENIED_ERROR', /DB_USER and DB_PASSWORD/],
  ['ER_BAD_DB_ERROR', /DB_NAME/],
  ['ER_DBACCESS_DENIED_ERROR', /no access to that database/],
  ['ETIMEDOUT', /took too long/],
];

for (const [code, expected] of cases) {
  test(`${code} gets a plain-words message`, () => {
    assert.match(describeDbError({ code }), expected);
  });
}

test('unknown code still gives a message', () => {
  assert.equal(describeDbError({ code: 'ER_WEIRD' }), 'Could not connect to the database (ER_WEIRD).');
  assert.equal(describeDbError(undefined), 'Could not connect to the database.');
});
