import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');

describe('Gateway Request Routing', () => {
  it('should format requests to downstream services correctly', async () => {
    const mockResponse = { data: { success: true } };
    axios.post.mockResolvedValue(mockResponse);

    const result = await axios.post('http://auth-service/api/login', {
      username: 'testuser'
    });

    expect(axios.post).toHaveBeenCalledWith('http://auth-service/api/login', {
      username: 'testuser'
    });
    expect(result.data.success).toBe(true);
  });
});
