import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { usePlayer, asset, format, collections, Track } from "../lib/player";
export const C = {
  bg: "#f5f7f9",
  ink: "#25303d",
  muted: "#94a0ae",
  blue: "#2398df",
  pale: "#eaf5fd",
  border: "#edf0f4",
  white: "#fff",
};
export function IconButton({
  name,
  onPress,
  color = C.muted,
  size = 21,
  label,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  color?: string;
  size?: number;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? name}
      onPress={onPress}
      style={s.icon}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}
export function Button({
  children,
  onPress,
  busy = false,
  secondary = false,
}: {
  children: string;
  onPress: () => void;
  busy?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={[s.button, secondary && { backgroundColor: C.pale }, busy && { opacity: 0.5 }]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? C.blue : "#fff"} />
      ) : (
        <Text style={[s.buttonText, secondary && { color: C.blue }]}>{children}</Text>
      )}
    </Pressable>
  );
}
export function Heading({
  title,
  sub,
  action,
  onAction,
}: {
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.heading}>
      <View style={{ flex: 1 }}>
        <Text style={s.h2}>{title}</Text>
        {sub && <Text style={s.caption}>{sub}</Text>}
      </View>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={{ fontSize: 11, color: C.blue }}>{action} ›</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Shell({
  children,
  title,
  subtitle,
  screen = "index",
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  screen?: string;
}) {
  const p = usePlayer(),
    focused = usePathname() === (screen === "index" ? "/" : `/${screen}`);
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.top}>
          <View style={s.logo}>
            <View style={s.logoIcon}>
              <Ionicons name="musical-notes" size={20} color="#fff" />
            </View>
            <Text style={s.brand}>
              gospel<Text style={{ color: C.blue, fontWeight: "400" }}>play</Text>
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Minha conta"
            onPress={() => router.push("/profile")}
            style={s.avatar}
          >
            <Text style={{ color: "#8c735c", fontWeight: "600" }}>
              {p.session?.user.name.charAt(0).toUpperCase() ?? "G"}
            </Text>
          </Pressable>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.eyebrow}>MÚSICA QUE CONECTA</Text>
          <Text style={s.h1}>{title}</Text>
          {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
          {children}
        </ScrollView>
        <MiniPlayer />
        {Boolean(p.message) && (
          <Pressable style={s.toast} onPress={() => p.setMessage("")}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#a3e0c3" />
            <Text style={s.toastText}>{p.message}</Text>
          </Pressable>
        )}
        <Modal
          transparent
          animationType="slide"
          visible={p.fullPlayer && focused}
          onRequestClose={() => p.setFullPlayer(false)}
        >
          <SafeAreaView style={s.fullPlayer}>
            <View style={s.modalHead}>
              <Text style={s.eyebrow}>SEU MOMENTO COM DEUS</Text>
              <IconButton name="chevron-down" onPress={() => p.setFullPlayer(false)} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              <PlayerCard />
              <QueueCard />
              <Text style={s.license}>
                Catálogo de demonstração. Os créditos e licenças estão disponíveis no perfil.
              </Text>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function PlayerCard() {
  const p = usePlayer(),
    [showChoices, setShowChoices] = useState(false),
    [width, setWidth] = useState(1);
  return (
    <View style={s.card}>
      <Pressable style={s.playerHeader} onPress={() => setShowChoices(!showChoices)}>
        <View style={s.contextIcon}>
          <Ionicons name="musical-notes" size={22} color={C.blue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.tinyLabel}>TOCANDO DA PLAYLIST</Text>
          <Text style={s.context}>{p.context}</Text>
        </View>
        <Ionicons name="chevron-down" size={19} color={C.muted} />
      </Pressable>
      {showChoices && (
        <View style={s.choiceList}>
          {collections.map((c) => (
            <Pressable
              key={c.name}
              onPress={() => {
                p.choose(c);
                setShowChoices(false);
              }}
              style={s.choice}
            >
              <Text style={{ fontSize: 13, color: C.ink }}>{c.name}</Text>
              {c.name === p.context && <Ionicons name="checkmark" size={18} color={C.blue} />}
            </Pressable>
          ))}
        </View>
      )}
      <View style={s.albumStage}>
        {p.track ? (
          <Image source={{ uri: asset(p.track.cover) }} style={s.album} />
        ) : (
          <View
            style={[
              s.album,
              { backgroundColor: C.pale, justifyContent: "center", alignItems: "center" },
            ]}
          >
            <Ionicons name="musical-notes" size={60} color={C.blue} />
          </View>
        )}
        <Text style={s.albumTag}>GRAÇA QUE TRANSFORMA</Text>
      </View>
      <View style={s.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.songTitle}>{p.track?.title ?? "Escolha um louvor"}</Text>
          <Text style={s.artist}>{p.track?.artist ?? "Seu momento de paz"}</Text>
        </View>
        <IconButton
          label="Favoritar música atual"
          name={p.track && p.liked.includes(p.track.id) ? "heart" : "heart-outline"}
          color={p.track && p.liked.includes(p.track.id) ? C.blue : C.muted}
          onPress={() => p.track && p.like(p.track)}
        />
      </View>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel="Posição da reprodução"
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onPress={(e) => {
          void p.player.seekTo(
            Math.max(0, Math.min(1, e.nativeEvent.locationX / width)) *
              (p.status.duration || p.track?.duration || 1),
          );
        }}
        style={s.seekArea}
      >
        <View style={s.rail}>
          <View
            style={[
              s.railFill,
              {
                width: `${Math.min(100, (100 * p.status.currentTime) / (p.status.duration || p.track?.duration || 1))}%`,
              },
            ]}
          />
        </View>
      </Pressable>
      <View style={s.times}>
        <Text style={s.time}>{format(p.status.currentTime)}</Text>
        <Text style={s.time}>{format(p.status.duration || p.track?.duration || 0)}</Text>
      </View>
      <View style={s.controls}>
        <IconButton
          name="shuffle"
          label="Alternar reprodução aleatória"
          color={p.shuffle ? C.blue : C.muted}
          onPress={() => p.setShuffle(!p.shuffle)}
        />
        <IconButton
          name="play-skip-back"
          label="Música anterior"
          color={C.ink}
          onPress={() => p.next(-1)}
        />
        <Pressable
          accessibilityLabel={p.status.playing ? "Pausar" : "Reproduzir"}
          onPress={p.toggle}
          style={s.bigPlay}
        >
          <Ionicons name={p.status.playing ? "pause" : "play"} size={27} color="#fff" />
        </Pressable>
        <IconButton
          name="play-skip-forward"
          label="Próxima música"
          color={C.ink}
          onPress={() => p.next()}
        />
        <IconButton
          name="repeat"
          label="Alternar repetição"
          color={p.repeat ? C.blue : C.muted}
          onPress={() => p.setRepeat(!p.repeat)}
        />
      </View>
      <View style={s.playerFoot}>
        <View style={s.greenDot} />
        <Text style={s.tinyLabel}>{p.status.playing ? "EM REPRODUÇÃO" : "SEU MOMENTO DE PAZ"}</Text>
      </View>
    </View>
  );
}
export function MiniPlayer() {
  const p = usePlayer();
  return (
    <View style={s.miniPlayer}>
      <Pressable style={s.miniInfo} onPress={() => p.setFullPlayer(true)}>
        {p.track && <Image source={{ uri: asset(p.track.cover) }} style={s.miniCover} />}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={s.miniTitle}>
            {p.track?.title ?? "Gospel Play"}
          </Text>
          <Text numberOfLines={1} style={s.miniArtist}>
            {p.track?.artist ?? "Escolha sua trilha sonora"}
          </Text>
        </View>
      </Pressable>
      <IconButton
        label={p.status.playing ? "Pausar música" : "Tocar música"}
        name={p.status.playing ? "pause" : "play"}
        color={C.blue}
        size={25}
        onPress={p.toggle}
      />
      <IconButton
        label="Próxima faixa"
        name="play-skip-forward"
        color={C.ink}
        size={20}
        onPress={() => p.next()}
      />
    </View>
  );
}
export function TrackRow({
  track,
  index,
  add = true,
}: {
  track: Track;
  index: number;
  add?: boolean;
}) {
  const p = usePlayer();
  return (
    <View style={s.trackRow}>
      <Text style={[s.trackIndex, p.track?.id === track.id && { color: C.blue }]}>
        {String(index + 1).padStart(2, "0")}
      </Text>
      <Pressable style={s.trackMain} onPress={() => p.play(track)}>
        <Image source={{ uri: asset(track.cover) }} style={s.trackCover} />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={[s.trackTitle, p.track?.id === track.id && { color: C.blue }]}
          >
            {track.title}
          </Text>
          <Text numberOfLines={1} style={s.trackArtist}>
            {track.artist}
          </Text>
        </View>
      </Pressable>
      <IconButton
        label={`Favoritar ${track.title}`}
        size={18}
        name={p.liked.includes(track.id) ? "heart" : "heart-outline"}
        color={p.liked.includes(track.id) ? C.blue : C.muted}
        onPress={() => p.like(track)}
      />
      {add && (
        <IconButton
          label={`Adicionar ${track.title} à fila`}
          size={18}
          name="add"
          onPress={() => {
            p.setQueue((q) => [...q, track.id]);
            p.setMessage("Música adicionada à fila.");
          }}
        />
      )}
    </View>
  );
}
export function PlaylistCards() {
  const p = usePlayer();
  return (
    <View style={s.playlists}>
      {collections.map((c) => (
        <Pressable style={s.playlistCard} onPress={() => p.choose(c)} key={c.name}>
          <View style={s.playlistImage}>
            <Image source={{ uri: asset(c.cover) }} style={StyleSheet.absoluteFill} />
            <View style={s.playlistShade} />
            <Text style={s.coverLabel}>gospelplay</Text>
            <Text style={s.coverTitle}>{c.description.toUpperCase()}</Text>
            <View style={s.coverPlay}>
              <Ionicons name="play" size={15} color="#fff" />
            </View>
          </View>
          <Text style={s.playlistTitle}>{c.name}</Text>
          <Text style={s.playlistCaption}>Seleção Gospel Play · demo</Text>
        </Pressable>
      ))}
    </View>
  );
}
export function QueueCard() {
  const p = usePlayer();
  return (
    <View style={[s.card, { marginTop: 16 }]}>
      <Heading title="Sua fila" sub={`${p.queue.length} músicas · ${p.context}`} />
      {p.queue.map((id, i) => {
        const t = p.tracks.find((t) => t.id === id);
        return t ? (
          <View key={`${id}-${i}`} style={s.queueRow}>
            <Pressable style={s.trackMain} onPress={() => p.play(t)}>
              <Image source={{ uri: asset(t.cover) }} style={s.trackCover} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={s.trackTitle}>
                  {t.title}
                </Text>
                <Text style={s.trackArtist}>{format(t.duration)}</Text>
              </View>
            </Pressable>
            <IconButton
              label="Mover música para cima"
              name="arrow-up"
              size={17}
              onPress={() => {
                if (!i) return;
                p.setQueue((q) => {
                  const n = [...q];
                  [n[i - 1], n[i]] = [n[i]!, n[i - 1]!];
                  return n;
                });
              }}
            />
            <IconButton
              label="Remover música da fila"
              name="close"
              size={17}
              onPress={() => p.setQueue((q) => q.filter((_, index) => index !== i))}
            />
          </View>
        ) : null;
      })}
      {!p.queue.length && <Text style={s.caption}>Fila vazia. Use + para adicionar músicas.</Text>}
    </View>
  );
}
export function CatalogState() {
  const p = usePlayer();
  return p.catalog.isLoading ? (
    <View style={s.empty}>
      <ActivityIndicator color={C.blue} />
      <Text style={s.caption}>Carregando seus louvores…</Text>
    </View>
  ) : p.catalog.error ? (
    <View style={s.notice}>
      <Text style={s.caption}>Não foi possível carregar o catálogo.</Text>
      <Button secondary onPress={() => p.catalog.refetch()}>
        Tentar novamente
      </Button>
    </View>
  ) : null;
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  top: {
    height: 65,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  logo: { flexDirection: "row", alignItems: "center", gap: 9 },
  logoIcon: {
    width: 32,
    height: 35,
    borderRadius: 10,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 24, fontWeight: "700", letterSpacing: -1, color: C.ink },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#f0e8df",
    borderWidth: 3,
    borderColor: "#f8f5f1",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: 22, paddingBottom: 30 },
  eyebrow: { fontSize: 8, letterSpacing: 2, color: "#a3aeba", fontWeight: "500" },
  h1: { fontSize: 27, letterSpacing: -0.8, fontWeight: "600", color: C.ink, marginTop: 8 },
  subtitle: { fontSize: 12, color: C.muted, lineHeight: 20, marginTop: 6, marginBottom: 22 },
  h2: { fontSize: 19, fontWeight: "600", letterSpacing: -0.4, color: C.ink },
  heading: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 15, marginTop: 22 },
  caption: { fontSize: 11, color: C.muted, lineHeight: 18, marginTop: 5 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 23,
    padding: 22,
  },
  playerHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  contextIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.pale,
    alignItems: "center",
    justifyContent: "center",
  },
  tinyLabel: { fontSize: 7, letterSpacing: 1.2, color: "#a6b0bc" },
  context: { fontSize: 13, color: "#596c7f", fontWeight: "500", marginTop: 5 },
  albumStage: { alignItems: "center", marginTop: 29, marginBottom: 23 },
  album: { width: 212, height: 212, borderRadius: 20 },
  albumTag: { fontSize: 6, letterSpacing: 2.1, color: "#b9ae98", marginTop: 15 },
  titleRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  songTitle: { fontSize: 22, fontWeight: "600", letterSpacing: -0.6, color: C.ink },
  artist: { fontSize: 11, color: C.muted, marginTop: 6 },
  seekArea: { height: 26, justifyContent: "center", marginTop: 18 },
  rail: { height: 3, borderRadius: 3, backgroundColor: "#e9edf2", overflow: "hidden" },
  railFill: { height: 3, backgroundColor: C.blue },
  times: { flexDirection: "row", justifyContent: "space-between" },
  time: { fontSize: 10, color: C.muted },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  bigPlay: {
    width: 57,
    height: 57,
    borderRadius: 30,
    backgroundColor: C.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { width: 31, height: 34, alignItems: "center", justifyContent: "center" },
  playerFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderTopWidth: 1,
    borderColor: C.border,
    paddingTop: 15,
  },
  greenDot: { height: 4, width: 4, borderRadius: 2, backgroundColor: "#91c4a8" },
  miniPlayer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "#e6edf3",
  },
  miniInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  miniCover: { height: 38, width: 38, borderRadius: 8 },
  miniTitle: { fontSize: 12, fontWeight: "500", color: C.ink },
  miniArtist: { fontSize: 9, color: C.muted, marginTop: 4 },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  trackIndex: { fontSize: 9, color: "#a6b0ba", width: 18 },
  trackMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  trackCover: { height: 39, width: 39, borderRadius: 8 },
  trackTitle: { fontSize: 12, fontWeight: "500", color: C.ink },
  trackArtist: { fontSize: 9, color: C.muted, marginTop: 5 },
  playlists: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  playlistCard: { width: "47%", marginBottom: 4 },
  playlistImage: { aspectRatio: 1, borderRadius: 14, overflow: "hidden" },
  playlistShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "#14202b35" },
  coverLabel: {
    position: "absolute",
    top: 11,
    left: 12,
    fontSize: 8,
    fontWeight: "500",
    color: "#ffffffc0",
  },
  coverTitle: {
    position: "absolute",
    left: 14,
    bottom: 30,
    right: 14,
    color: "#fff",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
    letterSpacing: 1,
  },
  coverPlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 27,
    height: 27,
    borderRadius: 15,
    backgroundColor: "#ffffff40",
    alignItems: "center",
    justifyContent: "center",
  },
  playlistTitle: { fontSize: 12, fontWeight: "500", color: C.ink, marginTop: 11 },
  playlistCaption: { fontSize: 9, color: C.muted, marginTop: 5 },
  button: {
    backgroundColor: C.blue,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  buttonText: { fontSize: 13, fontWeight: "500", color: "#fff" },
  notice: { backgroundColor: C.pale, padding: 18, borderRadius: 13, marginTop: 18 },
  empty: { padding: 32, alignItems: "center", gap: 12 },
  license: { fontSize: 9, color: "#a0aebb", lineHeight: 16, marginTop: 18 },
  queueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  choiceList: { marginTop: 15, backgroundColor: C.bg, borderRadius: 10, padding: 7 },
  choice: { flexDirection: "row", justifyContent: "space-between", padding: 12 },
  toast: {
    position: "absolute",
    bottom: 83,
    left: 18,
    right: 18,
    backgroundColor: "#254151",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toastText: { flex: 1, color: "#fff", fontSize: 11, lineHeight: 17 },
  fullPlayer: { flex: 1, backgroundColor: C.bg },
  modalHead: {
    paddingHorizontal: 22,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#fafcfd",
    borderWidth: 1,
    borderColor: "#e3ebf2",
    borderRadius: 10,
    padding: 13,
    fontSize: 13,
    color: C.ink,
    marginTop: 7,
  },
  label: { fontSize: 11, color: "#7f92a4", marginTop: 17 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
  },
  chipText: { fontSize: 11, color: "#8da0b1" },
  error: { fontSize: 11, color: "#b55258", lineHeight: 18, marginTop: 12 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },
});
