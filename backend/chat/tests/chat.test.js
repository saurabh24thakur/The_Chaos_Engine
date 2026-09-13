import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const messageSchema = z.object({
  senderId: z.string(),
  text: z.string().min(1),
  timestamp: z.date()
});

describe('Chat Service Payload Validation', () => {
  it('should validate a correct message payload', () => {
    const payload = {
      senderId: 'user_123',
      text: 'Hello, world!',
      timestamp: new Date()
    };
    const result = messageSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should fail on empty text', () => {
    const payload = {
      senderId: 'user_123',
      text: '',
      timestamp: new Date()
    };
    const result = messageSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
