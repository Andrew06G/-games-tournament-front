import { afterEach, describe, expect, it, vi } from 'vitest';
import { getApiBaseUrl, getSocketUrl } from './env';

describe('env', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads and trims VITE_API_URL', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:3000/api');
  });

  it('strips trailing slashes from the API URL', () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api///');
    expect(getApiBaseUrl()).toBe('http://localhost:3000/api');
  });

  it('reads VITE_SOCKET_URL', () => {
    expect(getSocketUrl()).toBe('http://localhost:3000');
  });

  it('throws when VITE_API_URL is missing or blank', () => {
    vi.stubEnv('VITE_API_URL', '');
    expect(() => getApiBaseUrl()).toThrow(/VITE_API_URL/);
  });

  it('throws when VITE_SOCKET_URL is missing or blank', () => {
    vi.stubEnv('VITE_SOCKET_URL', '   ');
    expect(() => getSocketUrl()).toThrow(/VITE_SOCKET_URL/);
  });
});
