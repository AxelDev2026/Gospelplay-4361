import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Shell,
  Heading,
  PlaylistCards,
  TrackRow,
  CatalogState,
  C,
  s,
} from "../../components/music-ui";
import { usePlayer } from "../../lib/player";
export default function Explore() {
  const p = usePlayer(),
    [search, setSearch] = useState(""),
    [genre, setGenre] = useState("Todos");
  const filtered = p.tracks.filter(
    (t) =>
      (genre === "Todos" || t.genre === genre) &&
      `${t.title} ${t.artist}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Shell
      screen="explore"
      title="Encontre seu próximo louvor."
      subtitle="Cada momento merece uma trilha sonora especial."
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#fff",
          borderRadius: 11,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 13,
          gap: 10,
        }}
      >
        <Ionicons name="search-outline" size={19} color={C.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar músicas e artistas"
          placeholderTextColor={C.muted}
          style={{ flex: 1, paddingVertical: 14, fontSize: 12, color: C.ink }}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 19 }}>
        {["Todos", "Instrumental", "Acústico", "Hinos"].map((g) => (
          <Pressable
            key={g}
            onPress={() => setGenre(g)}
            style={[s.chip, genre === g && { backgroundColor: C.blue }]}
          >
            <Text style={[s.chipText, genre === g && { color: "#fff" }]}>{g}</Text>
          </Pressable>
        ))}
      </View>
      <Heading
        title={search ? "Resultados da busca" : "Explore o catálogo"}
        sub={`${filtered.length} músicas · Catálogo de demonstração`}
      />
      <CatalogState />
      {filtered.map((t, i) => (
        <TrackRow key={t.id} track={t} index={i} />
      ))}
      {!filtered.length && !p.catalog.isLoading && (
        <View style={s.empty}>
          <Ionicons name="search" size={34} color="#a3cce4" />
          <Text style={s.caption}>Nenhuma música encontrada. Tente outra busca.</Text>
        </View>
      )}
      <Heading title="Encontre seu momento" />
      <PlaylistCards />
      <Text style={s.license}>
        Novos artistas independentes poderão integrar o catálogo após autorização dos titulares.
      </Text>
    </Shell>
  );
}
