import { useState } from "react";
import { View, Text, TextInput, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Shell, Button, Heading, C, s } from "../../components/music-ui";
import { usePlayer } from "../../lib/player";
import { authClient, captureToken } from "../../lib/auth";
export default function Profile() {
  const p = usePlayer(),
    [signup, setSignup] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit() {
    setError("");
    if (!email.includes("@") || password.length < 8 || (signup && !name.trim())) {
      setError("Preencha nome, e-mail válido e uma senha de pelo menos 8 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const result = signup
        ? await authClient.signUp.email({ name, email, password }, { onSuccess: captureToken })
        : await authClient.signIn.email({ email, password }, { onSuccess: captureToken });
      if (result.error) setError(result.error.message ?? "Não foi possível entrar.");
      else {
        setPassword("");
        p.setMessage("Bem-vindo à sua biblioteca.");
      }
    } catch {
      setError("Verifique sua conexão e tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    setBusy(true);
    setError("");
    try {
      const r = await authClient.managedAuth.signIn({ provider: "google" });
      if (r.error) setError(r.error.message ?? "Login cancelado.");
    } catch {
      setError("Não foi possível conectar ao Google.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      screen="profile"
      title={
        p.session ? "Olá, " + p.session.user.name.split(" ")[0] + "." : "Sua fé. Sua trilha sonora."
      }
      subtitle={
        p.session ? "Seu espaço no Gospel Play." : "Entre para levar sua biblioteca com você."
      }
    >
      {p.session ? (
        <>
          <View style={s.card}>
            <Text style={s.h2}>{p.session.user.name}</Text>
            <Text style={s.caption}>{p.session.user.email}</Text>
            <View style={s.notice}>
              <Text style={{ color: "#648aa6", fontSize: 12 }}>
                {p.premium
                  ? "Premium demonstrativo · sem cobrança"
                  : "Plano gratuito · anúncios demonstrativos"}
              </Text>
            </View>
            <Button onPress={() => router.push("/premium")}>Gerenciar meu plano</Button>
            <Button secondary onPress={() => router.push("/artist")}>
              Espaço do artista
            </Button>
            <Button
              secondary
              onPress={async () => {
                await authClient.signOut();
              }}
            >
              Sair da conta
            </Button>
          </View>
        </>
      ) : (
        <View style={s.card}>
          <Ionicons name="musical-notes" size={32} color={C.blue} />
          <Text style={[s.h2, { marginTop: 18 }]}>
            {signup ? "Crie sua conta" : "Que bom ter você por aqui."}
          </Text>
          <Button secondary onPress={google} busy={busy}>
            Continuar com Google
          </Button>
          <View style={s.divider} />
          <Text style={[s.caption, { textAlign: "center" }]}>ou use seu e-mail</Text>
          {signup && (
            <>
              <Text style={s.label}>Seu nome</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                autoComplete="name"
                placeholder="Como podemos te chamar?"
                placeholderTextColor={C.muted}
              />
            </>
          )}
          <Text style={s.label}>E-mail</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            placeholderTextColor={C.muted}
          />
          <Text style={s.label}>Senha</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={signup ? "new-password" : "current-password"}
            placeholder="Pelo menos 8 caracteres"
            placeholderTextColor={C.muted}
          />
          {Boolean(error) && <Text style={s.error}>{error}</Text>}
          <Button onPress={submit} busy={busy}>
            {signup ? "Criar minha conta" : "Entrar"}
          </Button>
          <Pressable
            onPress={() => {
              setSignup(!signup);
              setError("");
            }}
            style={{ padding: 16 }}
          >
            <Text style={{ fontSize: 11, textAlign: "center", color: C.blue }}>
              {signup ? "Já tem uma conta? Entrar" : "Ainda não tem conta? Cadastre-se"}
            </Text>
          </Pressable>
        </View>
      )}
      <Heading title="Sobre o Gospel Play" />
      <View style={s.notice}>
        <Text style={s.caption}>
          Versão de demonstração com três gravações de Amazing Grace. O plano Premium não gera
          cobranças. Os anúncios são espaços ilustrativos.
        </Text>
      </View>
      <Button secondary onPress={() => router.push("/artist")}>
        Sou artista · enviar minha música
      </Button>
      <Heading title="Créditos e autorizações" />
      {p.tracks.map((t) => (
        <View
          key={t.id}
          style={{ paddingVertical: 16, borderBottomWidth: 1, borderColor: C.border }}
        >
          <Text style={s.trackTitle}>{t.title}</Text>
          <Text style={s.caption}>{t.artist}</Text>
          <Text style={s.license}>{t.license}</Text>
          <Pressable onPress={() => Linking.openURL(t.source)}>
            <Text style={{ fontSize: 11, color: C.blue, marginTop: 10 }}>
              Ver fonte e licença ↗
            </Text>
          </Pressable>
        </View>
      ))}
      <Text style={s.license}>
        Imagens: Unsplash. Clima: Open-Meteo para demonstração não comercial. A operação comercial
        depende de catálogo autorizado e plano comercial do provedor de clima.
      </Text>
    </Shell>
  );
}
