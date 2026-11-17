import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Shell, Button, Heading, C, s } from "../../components/music-ui";
import { usePlayer } from "../../lib/player";
import { useSubmissions, useSubmit, useModerate } from "../../queries/music";
export default function Artist() {
  const p = usePlayer(),
    list = useSubmissions(!!p.session),
    submit = useSubmit(),
    moderate = useModerate(),
    [fields, setFields] = useState({
      title: "",
      artist: "",
      audio: "",
      cover: "",
      source: "",
      duration: "",
      license: "",
    }),
    [authorized, setAuthorized] = useState(false),
    [genre, setGenre] = useState("Adoração"),
    [error, setError] = useState("");
  async function send() {
    setError("");
    if (!authorized) {
      setError("Confirme que possui autorização dos titulares.");
      return;
    }
    try {
      await submit.mutateAsync({
        ...fields,
        duration: Number(fields.duration),
        genre: genre as "Adoração",
        authorized: true,
      });
      setFields({
        title: "",
        artist: "",
        audio: "",
        cover: "",
        source: "",
        duration: "",
        license: "",
      });
      setAuthorized(false);
      p.setMessage("Música enviada para análise dos direitos.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar.");
    }
  }
  return (
    <Shell
      screen="artist"
      title="Sua música tem uma missão."
      subtitle="Espaço do artista · Gospel Play"
    >
      {!p.session ? (
        <View style={s.card}>
          <Ionicons name="mic-outline" size={40} color={C.blue} />
          <Text style={[s.h2, { marginTop: 16 }]}>Vamos dar voz ao seu louvor?</Text>
          <Text style={s.caption}>
            Entre para enviar suas músicas e acompanhar a análise de autorização.
          </Text>
          <Button onPress={() => router.push("/profile")}>Entrar para enviar</Button>
        </View>
      ) : (
        <>
          <View style={s.card}>
            <Text style={s.h2}>Enviar música para análise</Text>
            <Text style={s.caption}>
              Somente músicas com autorização para distribuição e monetização.
            </Text>
            {[
              ["title", "Nome da música"],
              ["artist", "Nome do artista"],
              ["audio", "URL pública do áudio (HTTPS)"],
              ["cover", "URL da capa (HTTPS)"],
              ["source", "Link do documento de autorização"],
              ["duration", "Duração em segundos"],
              ["license", "Detalhes da licença (mínimo 15 caracteres)"],
            ].map(([key, label]) => (
              <View key={key}>
                <Text style={s.label}>{label}</Text>
                <TextInput
                  style={[s.input, key === "license" && { minHeight: 80 }]}
                  value={fields[key as keyof typeof fields]}
                  onChangeText={(v) => setFields((f) => ({ ...f, [key!]: v }))}
                  keyboardType={
                    key === "duration"
                      ? "number-pad"
                      : key === "audio" || key === "cover" || key === "source"
                        ? "url"
                        : "default"
                  }
                  autoCapitalize={
                    ["audio", "cover", "source"].includes(key!) ? "none" : "sentences"
                  }
                  multiline={key === "license"}
                  placeholderTextColor={C.muted}
                />
              </View>
            ))}
            <Text style={s.label}>Categoria</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
              {["Adoração", "Acústico", "Instrumental", "Hinos"].map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGenre(g)}
                  style={[s.chip, genre === g && { backgroundColor: C.blue }]}
                >
                  <Text style={[s.chipText, genre === g && { color: "#fff" }]}>{g}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: authorized }}
              onPress={() => setAuthorized(!authorized)}
              style={{ flexDirection: "row", gap: 12, marginTop: 22, alignItems: "flex-start" }}
            >
              <Ionicons
                name={authorized ? "checkbox" : "square-outline"}
                size={22}
                color={C.blue}
              />
              <Text style={[s.caption, { flex: 1, marginTop: 0 }]}>
                Declaro possuir autorização dos titulares da composição e da gravação para
                distribuição.
              </Text>
            </Pressable>
            <Text style={s.license}>
              A declaração não substitui a revisão dos documentos. Sua música ficará pendente até a
              aprovação do administrador.
            </Text>
            {Boolean(error) && <Text style={s.error}>{error}</Text>}
            <Button onPress={send} busy={submit.isPending}>
              Enviar para análise
            </Button>
          </View>
          <Heading title={p.library.data?.isAdmin ? "Gestão do catálogo" : "Meus envios"} />
          {list.isLoading ? (
            <ActivityIndicator color={C.blue} />
          ) : list.error ? (
            <Text style={s.error}>{list.error.message}</Text>
          ) : list.data?.length ? (
            list.data.map((t) => (
              <View key={t.id} style={[s.card, { marginBottom: 14 }]}>
                <Text style={s.trackTitle}>{t.title}</Text>
                <Text style={s.caption}>{t.artist}</Text>
                <Text style={{ fontSize: 10, color: C.blue, marginTop: 10 }}>
                  {t.status === "published"
                    ? "Publicado"
                    : t.status === "rejected"
                      ? "Rejeitado"
                      : "Em análise"}
                </Text>
                {p.library.data?.isAdmin && (
                  <>
                    <Button
                      secondary
                      busy={moderate.isPending}
                      onPress={() => moderate.mutate({ id: t.id, status: "published" })}
                    >
                      Publicar após revisão
                    </Button>
                    <Button
                      secondary
                      busy={moderate.isPending}
                      onPress={() => moderate.mutate({ id: t.id, status: "rejected" })}
                    >
                      Rejeitar
                    </Button>
                  </>
                )}
              </View>
            ))
          ) : (
            <Text style={s.caption}>Você ainda não enviou nenhuma música.</Text>
          )}
          {moderate.error && <Text style={s.error}>{moderate.error.message}</Text>}
          {!p.library.data?.isAdmin && (
            <View style={s.notice}>
              <Text style={s.caption}>
                Publicação disponível somente ao administrador definido no servidor (ADMIN_EMAIL).
              </Text>
            </View>
          )}
        </>
      )}
    </Shell>
  );
}
