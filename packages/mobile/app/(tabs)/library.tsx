import { useState } from "react";
import { View, Text, TextInput, Pressable, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Shell, Heading, TrackRow, QueueCard, Button, C, s } from "../../components/music-ui";
import { usePlayer } from "../../lib/player";
import { useCreatePlaylist } from "../../queries/music";
export default function Library() {
  const p = usePlayer(),
    create = useCreatePlaylist(),
    [tab, setTab] = useState("Favoritos"),
    [show, setShow] = useState(false),
    [name, setName] = useState(""),
    [error, setError] = useState("");
  async function save() {
    if (!name.trim()) {
      setError("Dê um nome à sua playlist.");
      return;
    }
    try {
      await create.mutateAsync({ name, trackIds: p.queue });
      setShow(false);
      setName("");
      p.setMessage("Playlist salva na sua biblioteca.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar a playlist.");
    }
  }
  const favorites = p.tracks.filter((t) => p.liked.includes(t.id));
  return (
    <Shell
      screen="library"
      title="Sua fé, do seu jeito."
      subtitle="Os louvores que fazem parte da sua história."
    >
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 22 }}>
        {["Favoritos", "Playlists", "Fila"].map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[s.chip, tab === t && { backgroundColor: C.blue }]}
          >
            <Text style={[s.chipText, tab === t && { color: "#fff" }]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      {tab === "Favoritos" ? (
        <>
          <Heading title="Perto do coração" sub={`${favorites.length} músicas favoritas`} />
          {favorites.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} />
          ))}
          {!favorites.length && (
            <View style={s.empty}>
              <Ionicons name="heart-outline" size={40} color="#a3cce4" />
              <Text style={s.h2}>Guarde seu próximo louvor.</Text>
              <Text style={[s.caption, { textAlign: "center" }]}>
                Toque no coração ao lado de uma música para salvá-la aqui.
              </Text>
              <Button secondary onPress={() => router.push("/explore")}>
                Explorar músicas
              </Button>
            </View>
          )}
          {!p.session && (
            <View style={s.notice}>
              <Text style={s.caption}>
                Favoritos salvos neste dispositivo. Entre para sincronizar sua biblioteca.
              </Text>
              <Button secondary onPress={() => router.push("/profile")}>
                Entrar na minha conta
              </Button>
            </View>
          )}
        </>
      ) : tab === "Fila" ? (
        <QueueCard />
      ) : (
        <>
          <Heading title="Suas playlists" sub="Uma trilha sonora para cada momento." />
          {p.library.isLoading && p.session ? (
            <ActivityIndicator color={C.blue} />
          ) : p.library.error ? (
            <Text style={s.error}>{p.library.error.message}</Text>
          ) : (
            p.library.data?.playlists.map((pl) => (
              <Pressable
                key={pl.id}
                style={[
                  s.card,
                  { flexDirection: "row", alignItems: "center", gap: 17, marginBottom: 13 },
                ]}
                onPress={() => p.choose({ name: pl.name, ids: JSON.parse(pl.trackIds) })}
              >
                <View style={{ backgroundColor: C.pale, borderRadius: 12, padding: 14 }}>
                  <Ionicons name="musical-notes-outline" size={30} color={C.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.h2}>{pl.name}</Text>
                  <Text style={s.caption}>{JSON.parse(pl.trackIds).length} músicas</Text>
                </View>
                <Ionicons name="play-circle" size={31} color={C.blue} />
              </Pressable>
            ))
          )}
          {!p.library.data?.playlists.length && (
            <View style={s.notice}>
              <Text style={s.caption}>
                {p.session
                  ? "Você ainda não tem playlists. Vamos criar a primeira?"
                  : "Entre para criar playlists e acessar sua biblioteca em outros dispositivos."}
              </Text>
            </View>
          )}
          <Button
            onPress={() => {
              if (!p.session) router.push("/profile");
              else {
                setShow(true);
                setError("");
              }
            }}
          >
            Criar playlist com a fila atual
          </Button>
        </>
      )}
      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
        <View
          style={{ flex: 1, backgroundColor: "#1b304c77", justifyContent: "center", padding: 25 }}
        >
          <View style={s.card}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={s.h2}>Nova playlist</Text>
              <Pressable onPress={() => setShow(false)}>
                <Ionicons name="close" size={22} color={C.muted} />
              </Pressable>
            </View>
            <Text style={s.caption}>{p.queue.length} músicas da fila atual.</Text>
            <Text style={s.label}>Nome da playlist</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Meu momento com Deus"
              placeholderTextColor={C.muted}
              maxLength={60}
            />
            {Boolean(error) && <Text style={s.error}>{error}</Text>}
            <Button onPress={save} busy={create.isPending}>
              Salvar playlist
            </Button>
          </View>
        </View>
      </Modal>
    </Shell>
  );
}
