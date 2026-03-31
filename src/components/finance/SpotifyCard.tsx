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
        togglePlay 
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
            <div className="glass-panel rounded-3xl aspect-square flex flex-col items-center justify-center gap-6 text-center group transition-all duration-500 hover:bg-white/[0.08] shadow-2xl">
                <div className="w-16 h-16 bg-[#1DB954]/20 rounded-full flex items-center justify-center animate-pulse">
                    <Music className="text-[#1DB954]" size={32} />
                </div>
                <div className="space-y-2 px-6">
                    <h4 className="text-lg font-bold text-white">Nocturnal Music</h4>
                    <p className="text-sm text-muted-foreground">Conecte seu Spotify para controlar as músicas.</p>
                </div>
                <button 
                  onClick={() => redirectToSpotifyAuth(clientId)}
                  className="px-8 py-3 rounded-2xl bg-[#1DB954] text-black font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-[#1DB954]/30 active:scale-95"
                >
                  Conectar Conta
                </button>
            </div>
        );
    }

    if (!playback) {
        return (
            <div className="glass-panel rounded-3xl aspect-square flex flex-col items-center justify-center gap-4 group transition-all duration-500 hover:bg-white/[0.08] shadow-2xl">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
                    <Music className="text-muted-foreground animate-bounce" size={24} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-white">Status: Inativo</p>
                    <p className="text-xs text-muted-foreground">Abra o Spotify para sincronizar</p>
                </div>
                <button 
                    onClick={logout}
                    className="mt-4 px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-muted-foreground transition-all"
                >
                    DESCONECTAR
                </button>
            </div>
        );
    }

    const track = playback.item;
    const albumUrl = track.album.images[0]?.url;
    const artistName = track.artists[0]?.name;

    return (
        <div className="relative h-[260px] w-full rounded-3xl overflow-hidden shadow-2xl group isolate">
            {/* Background Image - Static */}
            <img 
                src={albumUrl} 
                alt={track.name}
                className="absolute inset-0 w-full h-full object-cover rounded-[inherit]"
            />
            
            {/* Top Bar: Music & Artist Pill (Já possui fundo próprio) */}
            <div className="absolute top-5 left-5 z-10">
                <div className="bg-black/20 backdrop-blur-xl rounded-full p-1 pr-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
                        <img src={albumUrl} alt="Album Art" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col max-w-[150px]">
                        <span className="text-[11px] font-bold text-white leading-tight truncate">{track.name}</span>
                        <span className="text-[9px] text-white/50 leading-tight truncate font-medium">{artistName}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Progress & Time - Visible on Hover */}
            <div className="absolute bottom-[65px] left-6 right-6 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-xl">
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
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-2xl">
                <button 
                    onClick={prev}
                    className="w-9 h-9 flex items-center justify-center bg-white/[0.02] backdrop-blur-md rounded-full text-white/60 hover:text-white transition-all active:scale-75"
                >
                    <SkipBack size={16} fill="currentColor" strokeWidth={0} />
                </button>
                
                <button 
                    onClick={togglePlay}
                    className="w-11 h-11 bg-white/[0.05] backdrop-blur-3xl rounded-full flex items-center justify-center text-white transition-all hover:bg-white/10 active:scale-95"
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" strokeWidth={0} /> : <Play size={20} fill="currentColor" strokeWidth={0} />}
                </button>

                <button 
                    onClick={next}
                    className="w-9 h-9 flex items-center justify-center bg-white/[0.02] backdrop-blur-md rounded-full text-white/60 hover:text-white transition-all active:scale-75"
                >
                    <SkipForward size={16} fill="currentColor" strokeWidth={0} />
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
