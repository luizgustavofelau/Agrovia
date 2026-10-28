const bcrypt = require('bcrypt');
const { scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const derive = promisify(scrypt);
const BCRYPT_ROUNDS = 12;
const BCRYPT_PATTERN = /^\$2[ab]\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/;

function canHashWithBcrypt(password) {
  return typeof password === 'string' && password.length > 0 && Buffer.byteLength(password, 'utf8') <= 72;
}

// Reconhece também hashes malformados para nunca tratá-los como texto puro.
function isEncodedPassword(stored) {
  return typeof stored === 'string' && (stored.startsWith('scrypt$') || stored.startsWith('$2'));
}

function needsPasswordRehash(stored) {
  return !BCRYPT_PATTERN.test(stored) || bcrypt.getRounds(stored) < BCRYPT_ROUNDS;
}

async function hashPassword(password) {
  if (!canHashWithBcrypt(password)) throw new Error('PASSWORD_LENGTH_INVALID');
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, stored, allowLegacy = false) {
  if (typeof password !== 'string' || !password || typeof stored !== 'string' || !stored) return false;
  if (stored.startsWith('$2')) {
    if (!canHashWithBcrypt(password) || !BCRYPT_PATTERN.test(stored)) return false;
    return bcrypt.compare(password, stored);
  }
  if (!stored.startsWith('scrypt$')) return allowLegacy && stored === password;
  const parts = stored.split('$');
  if (parts.length !== 3 || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2])) return false;
  const key = await derive(password, parts[1], 64);
  return timingSafeEqual(key, Buffer.from(parts[2], 'hex'));
}

module.exports = { hashPassword, verifyPassword, canHashWithBcrypt, isEncodedPassword, needsPasswordRehash };
