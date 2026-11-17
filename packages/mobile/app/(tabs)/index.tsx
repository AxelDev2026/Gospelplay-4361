import { useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Location from "expo-location";
import {
  Shell,
  PlayerCard,
  Heading,
  PlaylistCards,
  TrackRow,
  CatalogState,
  Button,
  C,
  s,
} from "../../components/music-ui";
import { usePlayer, asset, collections } from "../../lib/player";
import { useWeather } from "../../queries/music";
export default function Home() {
  const p = usePlayer(),
    weather = useWeather(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    date = new Date();
  async function locate() {
    setBusy(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setError("Localização não autorizada");
        return;
      }
      const coords = (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }))
        .coords;
      await weather.mutateAsync({ latitude: coords.latitude, longitude: coords.longitude });
    } catch {
      setError("Clima indisponível");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      title={`Que bom ter você aqui${p.session ? ", " + p.session.user.name.split(" ")[0] : ""}.`}
      subtitle="Uma nova manhã. Um novo motivo para louvar."
    >
      <View style={h.widgets}>
        <View style={h.widget}>
          <View style={h.widgetLabel}>
            <Text style={h.label}>
              {date.toLocaleDateString("pt-BR", { month: "long" }).toUpperCase()}
            </Text>
            <Ionicons name="calendar-outline" size={19} color="#9aa5b1" />
          </View>
          <Text style={h.weekday}>{date.toLocaleDateString("pt-BR", { weekday: "long" })}</Text>
          <View style={h.days}>
            {[-1, 0, 1, 2].map((n) => {
              const d = new Date(date);
              d.setDate(d.getDate() + n);
              return (
                <Text key={n} style={[h.day, n === 0 && { color: C.blue }]}>
                  {d.getDate()}
                </Text>
              );
            })}
          </View>
          <Text style={h.foot}>
            {date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </Text>
        </View>
        <View style={h.widget}>
          <View style={h.widgetLabel}>
            <Text style={h.label}>SEU CLIMA</Text>
            <Ionicons name="partly-sunny-outline" size={22} color={C.blue} />
          </View>
          {weather.data ? (
            <>
              <Text style={h.temp}>{weather.data.temperature}°C</Text>
              <Text style={h.weatherText}>
                {weather.data.code === 0
                  ? "Céu limpo"
                  : weather.data.code < 4
                    ? "Parcialmente nublado"
                    : "Tempo variável"}
              </Text>
            </>
          ) : (
            <>
              <Text style={h.weatherTitle}>
                Lá fora, um
                <br />
                novo dia.
              </Text>
              <Pressable onPress={locate} disabled={busy}>
                <Text style={h.weatherLink}>
                  {busy ? "Carregando…" : error || "Ver clima na minha região ›"}
                </Text>
              </Pressable>
            </>
          )}
          <Text style={h.foot}>{weather.data ? "Open-Meteo" : "Ative sua localização"}</Text>
        </View>
      </View>
      <CatalogState />
      <PlayerCard />
      <Heading
        title="Para o seu momento"
        sub="Uma seleção especial para cada parte do seu dia."
        action="Ver tudo"
        onAction={() => router.push("/explore")}
      />
      <PlaylistCards />
      <Pressable style={h.hero} onPress={() => p.choose(collections[0]!)}>
        <Image source={{ uri: asset("/images/sunrise.jpg") }} style={StyleSheet.absoluteFill} />
        <View style={h.heroShade} />
        <Text style={h.heroEyebrow}>SELEÇÃO DO DIA</Text>
        <Text style={h.heroTitle}>
          Comece o dia com
          <br />o coração em paz.
        </Text>
        <Text style={h.heroCaption}>Louvores para renovar a sua fé.</Text>
        <View style={h.heroButton}>
          <Ionicons name="play" size={13} color="#385043" />
          <Text style={{ fontSize: 11, color: "#385043", fontWeight: "500" }}>Ouvir agora</Text>
        </View>
      </Pressable>
      <Heading title="Louvores para descobrir" sub="Gravações de domínio público · demonstração" />
      {p.tracks.map((t, i) => (
        <TrackRow key={t.id} track={t} index={i} />
      ))}
      {!p.premium && (
        <View style={h.ad}>
          <Text style={h.adLabel}>ESPAÇO PUBLICITÁRIO · DEMO</Text>
          <Ionicons name="sparkles-outline" size={24} color={C.blue} />
          <Text style={h.adTitle}>Seu louvor, sem pausas.</Text>
          <Text style={s.caption}>Sem anúncios por apenas R$ 10/mês.</Text>
          <Button secondary onPress={() => router.push("/premium")}>
            Conhecer Premium
          </Button>
        </View>
      )}
      <View style={h.verse}>
        <Text style={h.label}>UMA PALAVRA PARA HOJE</Text>
        <Text style={h.quote}>“Tudo quanto tem fôlego louve ao Senhor.”</Text>
        <Text style={h.foot}>Salmos 150:6</Text>
      </View>
    </Shell>
  );
}
const h = StyleSheet.create({
  widgets: { flexDirection: "row", gap: 14, marginBottom: 18 },
  widget: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 18,
    minHeight: 157,
  },
  widgetLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  label: { fontSize: 8, letterSpacing: 1.2, color: "#a2acb8" },
  weekday: {
    fontSize: 17,
    color: C.ink,
    fontWeight: "500",
    textTransform: "capitalize",
    marginTop: 7,
  },
  days: { flexDirection: "row", justifyContent: "space-between", marginTop: 17 },
  day: { fontSize: 26, color: "#b1b7c0", fontWeight: "500", letterSpacing: -1 },
  foot: { fontSize: 8, color: "#aeb8c3", marginTop: 9 },
  weatherTitle: {
    fontSize: 17,
    color: "#50677d",
    lineHeight: 24,
    fontWeight: "500",
    marginTop: 10,
  },
  weatherLink: { fontSize: 8, color: C.blue, marginTop: 8, lineHeight: 14 },
  temp: { fontSize: 32, color: C.blue, marginTop: 10 },
  weatherText: { fontSize: 10, color: C.muted, marginTop: 5 },
  hero: { height: 246, borderRadius: 20, overflow: "hidden", padding: 23, marginTop: 27 },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "#1d2f2b77" },
  heroEyebrow: { fontSize: 7, color: "#fff", letterSpacing: 2 },
  heroTitle: {
    fontSize: 26,
    fontWeight: "500",
    color: "#fff",
    lineHeight: 35,
    letterSpacing: -0.6,
    marginTop: 18,
  },
  heroCaption: { fontSize: 11, color: "#ffffffbb", marginTop: 10 },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 19,
  },
  ad: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#cce2f1",
    borderStyle: "dashed",
    backgroundColor: C.pale,
    padding: 22,
    marginTop: 27,
  },
  adLabel: { fontSize: 6, color: "#a0b4c4", letterSpacing: 1.3, marginBottom: 14 },
  adTitle: { fontSize: 17, fontWeight: "500", color: "#42617a", marginTop: 12 },
  verse: { alignItems: "center", marginTop: 30 },
  quote: {
    fontSize: 13,
    color: "#8d9bab",
    fontStyle: "italic",
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
});
