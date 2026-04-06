import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCurrentlyPlaying, refreshAccessToken, getAccessToken, nextTrack, previousTrack, pauseTrack, playTrack, transferPlayback } from '../lib/spotify';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';

interface SpotifyContextType {
    accessToken: string | null;
    playback: any;
    isLoading: boolean;
    error: string | null;
    handleAuthCallback: (code: string) => Promise<void>;
    logout: () => Promise<void>;
    updatePlayback: () => Promise<void>;
    next: () => Promise<void>;
    prev: () => Promise<void>;
    togglePlay: () => Promise<void>;
    isAuthenticated: boolean;
    clientId: string;
    localDeviceId: string | null;
    isPlayerReady: boolean;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, profile } = useAuth();
    const userId = user?.id;
    const remoteRefreshToken = profile?.spotify_refresh_token;

    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('spotify_access_token'));
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('spotify_refresh_token') || remoteRefreshToken || null);
    const [playback, setPlayback] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { deviceId: localDeviceId, isReady: isPlayerReady } = useSpotifyPlayer(accessToken);

    const storeTokens = useCallback(async (tokens: any) => {
        if (tokens.access_token) {
            setAccessToken(tokens.access_token);
            localStorage.setItem('spotify_access_token', tokens.access_token);
        }
        if (tokens.refresh_token) {
            setRefreshToken(tokens.refresh_token);
            localStorage.setItem('spotify_refresh_token', tokens.refresh_token);
            
            if (userId) {
                await supabase.from('profiles').update({ spotify_refresh_token: tokens.refresh_token }).eq('id', userId);
            }
        }
    }, [userId]);

    const logout = useCallback(async () => {
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_code_verifier');
        setPlayback(null);

        if (userId) {
            await supabase.from('profiles').update({ spotify_refresh_token: null }).eq('id', userId);
        }
    }, [userId]);

    const refresh = useCallback(async () => {
        if (!refreshToken) return;
        try {
            const tokens = await refreshAccessToken(CLIENT_ID, refreshToken);
            await storeTokens(tokens);
            return tokens.access_token;
        } catch (err: any) {
            console.error('Refresh failed', err);
            if (err.status === 400 || err.status === 401) {
                await logout();
            }
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
            } else if (err.status !== 500) {
                setPlayback(null);
            }
        }
    }, [accessToken, refresh]);

    const handleAuthCallback = useCallback(async (code: string) => {
        setIsLoading(true);
        try {
            const tokens = await getAccessToken(CLIENT_ID, code);
            await storeTokens(tokens);
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
        if (!accessToken) return;
        try {
            if (playback?.is_playing) {
                await pauseTrack(accessToken);
            } else {
                if (!playback && localDeviceId) {
                    await transferPlayback(accessToken, localDeviceId);
                } else {
                    await playTrack(accessToken, localDeviceId || undefined);
                }
            }
            setTimeout(updatePlayback, 500);
        } catch (err) { console.error(err); }
    }, [accessToken, playback, updatePlayback, localDeviceId]);

    // RESTORE SESSION FROM DB IF NEEDED
    useEffect(() => {
        if (!refreshToken && remoteRefreshToken) {
            setRefreshToken(remoteRefreshToken);
            localStorage.setItem('spotify_refresh_token', remoteRefreshToken);
        }
    }, [remoteRefreshToken, refreshToken]);

    useEffect(() => {
        if (!accessToken && refreshToken) {
            refresh();
        }
    }, [accessToken, refreshToken, refresh]);

    useEffect(() => {
        if (!accessToken) return;
        updatePlayback();
        const interval = setInterval(updatePlayback, 5000);
        return () => clearInterval(interval);
    }, [accessToken, updatePlayback]);

    return (
        <SpotifyContext.Provider value={{
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
            isAuthenticated: !!accessToken || !!refreshToken,
            clientId: CLIENT_ID,
            localDeviceId,
            isPlayerReady
        }}>
            {children}
        </SpotifyContext.Provider>
    );
};

export const useSpotifyContext = () => {
    const context = useContext(SpotifyContext);
    if (!context) {
        throw new Error('useSpotifyContext must be used within a SpotifyProvider');
    }
    return context;
};
