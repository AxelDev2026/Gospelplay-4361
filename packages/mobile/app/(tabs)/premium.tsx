import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Shell, Button, C, s } from "../../components/music-ui";
import { usePlayer } from "../../lib/player";
export default function Premium() {
  const p = usePlayer();
  return (
    <Shell
      screen="premium"
      title="Mais louvor. Nenhuma pausa."
      subtitle="Sua trilha sonora de fé, sem interrupções."
    >
      <View style={v.hero}>
        <Ionicons name="sparkles-outline" size={35} color="#9fdaff" />
        <Text style={v.eyebrow}>GOSPEL PLAY PREMIUM</Text>
        <Text style={v.title}>
          Só você e o<br />
          seu momento com Deus.
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 23 }}>
          <Text style={v.price}>R$ 10</Text>
          <Text style={v.month}>/mês</Text>
        </View>
        <Text style={v.caption}>Uma assinatura simples. Um propósito maior.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.h2}>Seu louvor, sem anúncios.</Text>
        {[
          "Ouça sem interrupções",
          "Apoie artistas gospel independentes",
          "Sua biblioteca no site e no aplicativo",
        ].map((t) => (
          <View key={t} style={v.benefit}>
            <Ionicons name="checkmark-circle-outline" size={20} color={C.blue} />
            <Text style={{ flex: 1, fontSize: 13, color: "#657b8e", lineHeight: 21 }}>{t}</Text>
          </View>
        ))}
        <View style={[s.notice, { flexDirection: "row", gap: 12 }]}>
          <Ionicons name="shield-checkmark-outline" size={23} color={C.blue} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: "#58758c", fontWeight: "500" }}>
              Assinatura demonstrativa
            </Text>
            <Text style={s.caption}>
              Nenhum cartão ou pagamento será solicitado. A cobrança real ainda não está habilitada.
            </Text>
          </View>
        </View>
        <Button onPress={p.activate} busy={p.premiumBusy}>
          {p.premium ? "Voltar ao plano gratuito" : "Experimentar Premium (demo)"}
        </Button>
        {p.premium && (
          <Text style={{ color: "#66a586", fontSize: 11, textAlign: "center", marginTop: 17 }}>
            Premium demonstrativo ativado. Sem cobrança.
          </Text>
        )}
      </View>
      <Text style={s.license}>
        O preço de R$ 10/mês é uma proposta para o lançamento. A publicação comercial depende de
        catálogo autorizado, integração de cobrança e adequação às regras das lojas.
      </Text>
    </Shell>
  );
}
const v = StyleSheet.create({
  hero: { backgroundColor: "#19465f", borderRadius: 22, padding: 28, marginBottom: 22 },
  eyebrow: { fontSize: 8, letterSpacing: 2, color: "#a6cfe8", marginTop: 20 },
  title: {
    fontSize: 29,
    fontWeight: "500",
    lineHeight: 40,
    letterSpacing: -0.7,
    color: "#fff",
    marginTop: 13,
  },
  price: { fontSize: 43, fontWeight: "500", color: "#fff", letterSpacing: -1.3 },
  month: { fontSize: 15, color: "#b4d4e7", marginLeft: 10 },
  caption: { fontSize: 11, color: "#a6c7dd", lineHeight: 19, marginTop: 11 },
  benefit: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22 },
});
