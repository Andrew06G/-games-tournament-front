import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearStoredTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokens,
} from './authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no tokens are stored', () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('stores and retrieves the access token', () => {
    setAccessToken('access-abc');
    expect(getAccessToken()).toBe('access-abc');
    expect(getRefreshToken()).toBeNull();
  });

  it('stores both tokens with setTokens', () => {
    setTokens('access-xyz', 'refresh-xyz');
    expect(getAccessToken()).toBe('access-xyz');
    expect(getRefreshToken()).toBe('refresh-xyz');
  });

  it('clears both tokens', () => {
    setTokens('a', 'r');
    clearStoredTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
