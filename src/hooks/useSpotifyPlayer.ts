import { useState, useEffect } from "react";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export const useSpotifyPlayer = (accessToken: string | null) => {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(localStorage.getItem('spotify_player_device_id'));
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Nocturnal Cockpit",
        getOAuthToken: (cb: any) => { cb(accessToken); },
        volume: 0.5
      });

      setPlayer(player);

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        localStorage.setItem('spotify_player_device_id', device_id);
        setIsReady(true);
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });

      player.connect();
    };

    return () => {
      if (player) {
         player.disconnect();
      }
      document.body.removeChild(script);
    };
  }, [accessToken]);

  return { player, deviceId, isReady };
};
