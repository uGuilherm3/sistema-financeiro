import { Play, Pause, SkipBack, SkipForward, Music, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useSpotify } from "@/hooks/useSpotify";
import { redirectToSpotifyAuth } from "@/lib/spotify";

const SpotifyCard = () => {
    const {
        playback,
        isAuthenticated,
        clientId,
        logout,
        next,
        prev,
        togglePlay,
        isPlayerReady
    } = useSpotify();

    const [progressMs, setProgressMs] = useState(0);
    const [localProgress, setLocalProgress] = useState(0);

    useEffect(() => {
        if (playback?.progress_ms !== undefined) {
            setProgressMs(playback.progress_ms);
        }
    }, [playback?.progress_ms]);

    useEffect(() => {
        if (!playback?.is_playing) return;
        const tick = setInterval(() => {
            setProgressMs(prev => {
                const nextValue = prev + 1000;
                return nextValue > playback.item.duration_ms ? playback.item.duration_ms : nextValue;
            });
        }, 1000);
        return () => clearInterval(tick);
    }, [playback?.is_playing, playback?.item?.duration_ms]);

    useEffect(() => {
        if (progressMs && playback?.item?.duration_ms) {
            setLocalProgress((progressMs / playback.item.duration_ms) * 100);
        }
    }, [progressMs, playback?.item?.duration_ms]);

    const isPlaying = playback?.is_playing || false;

    if (!isAuthenticated) {
        return (
            <div className="glass-panel rounded-3xl h-[235px] flex flex-col items-center justify-center gap-6 text-center group transition-all duration-500 hover:bg-white/[0.08]">
                <div className="w-16 h-16 bg-[#1DB954]/10 rounded-full flex items-center justify-center animate-bounce">
                    <Music className="text-white/60" size={32} />
                </div>
                <button
                    onClick={() => redirectToSpotifyAuth(clientId)}
                    className="px-8 py-3 rounded-2xl bg-[#1DB954] text-black font-bold text-sm transition-all hover:scale-105 active:scale-95"
                >
                    Conectar Conta
                </button>
                <div className="space-y-1 px-6">
                    <h4 className="text-lg font-bold text-white tracking-tight">Nocturnal Music</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">Conecte seu Spotify para controlar as músicas.</p>
                </div>
            </div>
        );
    }

    if (!playback) {
        return (
            <div className="glass-panel rounded-3xl h-[235px] flex flex-col items-center justify-center gap-6 group transition-all duration-500 hover:bg-white/[0.04]">
                {isPlayerReady ? (
                    <button
                        onClick={togglePlay}
                        className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center"
                    >
                        <Music className="text-white/40 animate-bounce" size={26} />
                    </button>
                ) : (
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                        <Music className="text-muted-foreground opacity-50 animate-pulse" size={30} />
                    </div>
                )}

                <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-white">
                        {isPlayerReady ? "Nocturnal Player" : "Status: Inativo"}
                    </p>
                    <p className="text-xs text-muted-foreground px-4">
                        {isPlayerReady ? "Pronto para tocar neste dispositivo" : "Abra o Spotify para sincronizar"}
                    </p>
                </div>

                {!isPlayerReady && (
                    <button
                        onClick={logout}
                        className="mt-2 px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-muted-foreground transition-all"
                    >
                        DESCONECTAR
                    </button>
                )}
            </div>
        );
    }

    const track = playback.item;
    const albumUrl = track.album.images[0]?.url;
    const artistName = track.artists[0]?.name;

    return (
        <div className="relative h-[235px] w-full rounded-3xl overflow-hidden group isolate">
            {/* Background Image - Static */}
            <img
                src={albumUrl}
                alt={track.name}
                className="absolute inset-0 w-full h-full object-cover rounded-[inherit]"
            />

            {/* Top Bar: Music & Artist Pill - Slides down on hover */}
            <div className="absolute top-5 left-5 z-20 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
                <div className="bg-black/20 backdrop-blur-md rounded-full p-1.5 pr-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img src={albumUrl} alt="Album Art" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col max-w-[150px]">
                        <span className="text-[11px] font-bold text-white leading-tight truncate">{track.name}</span>
                        <span className="text-[9px] text-white/50 leading-tight truncate font-medium">{artistName}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Progress & Time - Visible on Hover */}
            <div className="absolute bottom-[60px] left-6 right-6 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex justify-between items-center text-[10px] font-mono font-medium text-white/80">
                    <span>{Math.floor(progressMs / 60000)}:{String(Math.floor((progressMs % 60000) / 1000)).padStart(2, '0')}</span>
                    <span className="opacity-60">-{Math.floor((track.duration_ms - progressMs) / 60000)}:{String(Math.floor(((track.duration_ms - progressMs) % 60000) / 1000)).padStart(2, '0')}</span>
                </div>
                <div className="h-1 w-full bg-white/5 backdrop-blur-md rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white/40 backdrop-blur-sm rounded-full transition-all duration-700 ease-linear"
                        style={{ width: `${localProgress}%` }}
                    />
                </div>
            </div>

            {/* Navigation Controls - Hidden by default, visible on hover */}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={prev}
                    className="w-11 h-11 flex items-center justify-center bg-transparent rounded-full text-white/60 hover:text-white transition-all"
                >
                    <SkipBack size={18} fill="currentColor" strokeWidth={0} />
                </button>

                <button
                    onClick={togglePlay}
                    className="w-11 h-11 bg-transparent rounded-full flex items-center justify-center text-white transition-all hover:bg-white/10"
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" strokeWidth={0} /> : <Play size={20} fill="currentColor" strokeWidth={0} />}
                </button>

                <button
                    onClick={next}
                    className="w-11 h-11 flex items-center justify-center bg-transparent rounded-full text-white/60 hover:text-white transition-all"
                >
                    <SkipForward size={18} fill="currentColor" strokeWidth={0} />
                </button>
            </div>

            {/* Logout Visible on Hover */}
            <div className="absolute bottom-1 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={logout} className="text-[7px] text-white/30 hover:text-white/60 font-bold tracking-widest transition-colors uppercase">
                    LOGOUT
                </button>
            </div>
        </div>
    );
};

export default SpotifyCard;
