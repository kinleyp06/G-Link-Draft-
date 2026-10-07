import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../../src/utils/AppError.js';

test('AppError keeps message, status code and code', () => {
  const err = new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  assert.ok(err instanceof Error);
  assert.equal(err.name, 'AppError');
  assert.equal(err.message, 'Room not found');
  assert.equal(err.statusCode, 404);
  assert.equal(err.code, 'ROOM_NOT_FOUND');
});

test('AppError defaults to 400 BAD_REQUEST', () => {
  const err = new AppError('Bad input');
  assert.equal(err.statusCode, 400);
  assert.equal(err.code, 'BAD_REQUEST');
});
