import { useState, useEffect, useCallback } from 'react';
import { fetchCurrentlyPlaying, refreshAccessToken, getAccessToken, nextTrack, previousTrack, pauseTrack, playTrack } from '../lib/spotify';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';

export const useSpotify = () => {
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('spotify_access_token'));
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('spotify_refresh_token'));
    const [playback, setPlayback] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const storeTokens = useCallback((tokens: any) => {
        if (tokens.access_token) {
            setAccessToken(tokens.access_token);
            localStorage.setItem('spotify_access_token', tokens.access_token);
        }
        if (tokens.refresh_token) {
            setRefreshToken(tokens.refresh_token);
            localStorage.setItem('spotify_refresh_token', tokens.refresh_token);
        }
    }, []);

    const logout = useCallback(() => {
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_code_verifier');
        setPlayback(null);
    }, []);

    const refresh = useCallback(async () => {
        if (!refreshToken) return;
        try {
            const tokens = await refreshAccessToken(CLIENT_ID, refreshToken);
            storeTokens(tokens);
            return tokens.access_token;
        } catch (err) {
            console.error('Refresh failed', err);
            logout();
        }
    }, [refreshToken, storeTokens, logout]);

    const updatePlayback = useCallback(async () => {
        if (!accessToken) return;
        try {
            const data = await fetchCurrentlyPlaying(accessToken);
            setPlayback(data);
        } catch (err: any) {
            if (err.status === 401) {
                console.log('Spotify token expired, refreshing...');
                const newToken = await refresh();
                if (newToken) {
                    try {
                        const data = await fetchCurrentlyPlaying(newToken);
                        setPlayback(data);
                    } catch (retryErr) {
                        console.error('Fetch playback failed after refresh', retryErr);
                        setPlayback(null);
                    }
                }
            } else {
                console.error('Fetch playback failed', err);
                // Keep the current playback state if it's a transient error, 
                // or nullify if it's persistent. For now, let's just nullify if not 401.
                if (err.status >= 500) {
                   // Transient server error, maybe don't nullify?
                } else {
                   setPlayback(null);
                }
            }
        }
    }, [accessToken, refresh]);

    const handleAuthCallback = useCallback(async (code: string) => {
        setIsLoading(true);
        try {
            const tokens = await getAccessToken(CLIENT_ID, code);
            storeTokens(tokens);
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
            setError('Auth failed');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [storeTokens]);

    const next = useCallback(async () => {
        if (!accessToken) return;
        try {
            await nextTrack(accessToken);
            setTimeout(updatePlayback, 500);
        } catch (err) { console.error(err); }
    }, [accessToken, updatePlayback]);

    const prev = useCallback(async () => {
        if (!accessToken) return;
        try {
            await previousTrack(accessToken);
            setTimeout(updatePlayback, 500);
        } catch (err) { console.error(err); }
    }, [accessToken, updatePlayback]);

    const togglePlay = useCallback(async () => {
        if (!accessToken || !playback) return;
        try {
            if (playback.is_playing) {
                await pauseTrack(accessToken);
            } else {
                await playTrack(accessToken);
            }
            setTimeout(updatePlayback, 500);
        } catch (err) { console.error(err); }
    }, [accessToken, playback, updatePlayback]);

    useEffect(() => {
        if (!accessToken) return;
        updatePlayback();
        const interval = setInterval(updatePlayback, 5000);
        return () => clearInterval(interval);
    }, [accessToken, updatePlayback]);

    return {
        accessToken,
        playback,
        isLoading,
        error,
        handleAuthCallback,
        logout,
        updatePlayback,
        next,
        prev,
        togglePlay,
        isAuthenticated: !!accessToken,
        clientId: CLIENT_ID,
    };
};
