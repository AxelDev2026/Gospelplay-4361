import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import { useCatalog, useLibrary, useFavorite, usePremium } from "../queries/music";
import { authClient } from "./auth";
export type Track = NonNullable<ReturnType<typeof useCatalog>["data"]>[number];
export const baseURL = String(Constants.expoConfig?.extra?.apiUrl ?? "").replace(/\/$/, "");
export const asset = (path: string) => (path.startsWith("http") ? path : baseURL + path);
export const format = (n: number) =>
  `${Math.floor((n || 0) / 60)}:${String(Math.floor((n || 0) % 60)).padStart(2, "0")}`;
export const collections = [
  {
    name: "Manhã com Deus",
    description: "Paz para recomeçar",
    cover: "/images/mountain.jpg",
    ids: ["grace-strings", "grace-acoustic", "grace-brass"],
  },
  {
    name: "Momento de adoração",
    description: "Ele está aqui",
    cover: "/images/worship.jpg",
    ids: ["grace-acoustic", "grace-brass", "grace-strings"],
  },
  {
    name: "Paz para a alma",
    description: "Descanse Nele",
    cover: "/images/peace.jpg",
    ids: ["grace-strings"],
  },
  {
    name: "Hinos que abraçam",
    description: "Graça que transforma",
    cover: "/images/praise.jpg",
    ids: ["grace-brass", "grace-acoustic"],
  },
];
function usePlayerState() {
  const catalog = useCatalog(),
    sessionQuery = authClient.useSession(),
    session = sessionQuery.data,
    library = useLibrary(!!session),
    fav = useFavorite(),
    membership = usePremium();
  const tracks = catalog.data ?? [];
  const [selected, setSelected] = useState("grace-strings"),
    [queue, setQueue] = useState<string[]>(collections[0]!.ids),
    [context, setContext] = useState("Manhã com Deus"),
    [shuffle, setShuffle] = useState(false),
    [repeat, setRepeat] = useState(false),
    [localLiked, setLocalLiked] = useState<string[]>([]),
    [localPremium, setLocalPremium] = useState(false),
    [ready, setReady] = useState(false),
    [message, setMessage] = useState(""),
    [fullPlayer, setFullPlayer] = useState(false);
  const player = useAudioPlayer(null),
    status = useAudioPlayerStatus(player),
    track = tracks.find((t) => t.id === selected) ?? tracks[0];
  const autoplay = useRef(false);
  const nextRef = useRef<(direction?: number) => void>(() => {});
  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
    AsyncStorage.multiGet(["gp-favorites", "gp-premium-demo"]).then((values) => {
      try {
        setLocalLiked(JSON.parse(values[0]?.[1] ?? "[]"));
        setLocalPremium(JSON.parse(values[1]?.[1] ?? "false"));
      } catch {}
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (ready) {
      void AsyncStorage.setItem("gp-favorites", JSON.stringify(localLiked));
      void AsyncStorage.setItem("gp-premium-demo", JSON.stringify(localPremium));
    }
  }, [localLiked, localPremium, ready]);
  useEffect(() => {
    if (track) {
      player.replace({ uri: asset(track.audio) });
      if (autoplay.current) player.play();
    }
  }, [track, player]);
  useEffect(() => {
    player.loop = repeat;
  }, [repeat, player]);
  useEffect(() => {
    if (status.didJustFinish && !repeat) nextRef.current();
  }, [status.didJustFinish, repeat]);
  useEffect(() => {
    const t = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(t);
  }, [message]);
  const liked = session ? (library.data?.favorites ?? []) : localLiked,
    premium = session ? (library.data?.premium ?? false) : localPremium;
  function play(t: Track) {
    autoplay.current = true;
    if (t.id === selected) player.play();
    else setSelected(t.id);
  }
  function toggle() {
    if (status.playing) player.pause();
    else {
      autoplay.current = true;
      player.play();
    }
  }
  function next(direction = 1) {
    const ids = queue.length ? queue : tracks.map((t) => t.id);
    if (!ids.length) return;
    const i = ids.indexOf(selected);
    const id = shuffle
      ? ids[Math.floor(Math.random() * ids.length)]
      : ids[(i + direction + ids.length) % ids.length];
    const t = tracks.find((t) => t.id === id);
    if (t) play(t);
  }
  nextRef.current = next;
  function like(t: Track) {
    const yes = !liked.includes(t.id);
    if (session) fav.mutate({ id: t.id, liked: yes }, { onError: (e) => setMessage(e.message) });
    else setLocalLiked((prev) => (yes ? [...prev, t.id] : prev.filter((id) => id !== t.id)));
  }
  function choose(c: { name: string; ids: string[] }) {
    setContext(c.name);
    setQueue(c.ids);
    const t = tracks.find((t) => t.id === c.ids[0]);
    if (t) play(t);
  }
  async function activate() {
    if (session) {
      try {
        await membership.mutateAsync({ enabled: !premium });
        setMessage(premium ? "Plano gratuito ativado." : "Premium demo ativado. Sem cobrança.");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Não foi possível atualizar.");
      }
    } else {
      setLocalPremium(!premium);
      setMessage(premium ? "Plano gratuito ativado." : "Premium demo ativado neste dispositivo.");
    }
  }
  return {
    catalog,
    tracks,
    session,
    sessionPending: sessionQuery.isPending,
    library,
    track,
    queue,
    setQueue,
    context,
    setContext,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
    player,
    status,
    play,
    toggle,
    next,
    liked,
    like,
    premium,
    activate,
    premiumBusy: membership.isPending,
    choose,
    message,
    setMessage,
    fullPlayer,
    setFullPlayer,
  };
}
const PlayerContext = createContext<ReturnType<typeof usePlayerState> | null>(null);
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const value = usePlayerState();
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
export function usePlayer() {
  const c = useContext(PlayerContext);
  if (!c) throw new Error("PlayerProvider ausente");
  return c;
}
