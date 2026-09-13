import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Auth Service', () => {
  it('should hash a password correctly', async () => {
    const password = 'mysecretpassword';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should generate a valid JWT token', () => {
    const secret = 'test-secret';
    const payload = { userId: '123' };
    const token = jwt.sign(payload, secret);
    const decoded = jwt.verify(token, secret);
    expect(decoded.userId).toBe('123');
  });
});
