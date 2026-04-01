/**
 * Spotify API Helpers (PKCE Flow)
 */

const REDIRECT_URI = window.location.origin.replace('localhost', '127.0.0.1') + '/';
const SCOPES = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';

// Generate a random string for the Code Verifier
export const generateCodeVerifier = (length: number) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// SHA-256 hashing for the Code Challenge
export const generateCodeChallenge = async (codeVerifier: string) => {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const redirectToSpotifyAuth = async (clientId: string) => {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem('spotify_code_verifier', verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getAccessToken = async (clientId: string, code: string) => {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');

  if (!codeVerifier) throw new Error('No code verifier found');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  return await response.json();
};

export const refreshAccessToken = async (clientId: string, refreshToken: string) => {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  return await response.json();
};

export const fetchCurrentlyPlaying = async (accessToken: string) => {
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 204) return null;
  if (!response.ok) {
    const error = new Error('Failed to fetch currently playing');
    (error as any).status = response.status;
    throw error;
  }
  return await response.json();
};

export const nextTrack = async (accessToken: string) => {
  await fetch('https://api.spotify.com/v1/me/player/next', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
};

export const previousTrack = async (accessToken: string) => {
  await fetch('https://api.spotify.com/v1/me/player/previous', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
};

export const pauseTrack = async (accessToken: string) => {
  await fetch('https://api.spotify.com/v1/me/player/pause', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
};

export const playTrack = async (accessToken: string) => {
  await fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
};
