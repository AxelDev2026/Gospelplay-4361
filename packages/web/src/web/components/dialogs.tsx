import { useState, useRef, useEffect } from "react";
import { X, Music2, Check, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { authClient } from "../lib/auth";
import { useSubmit, useSubmissions, useModerate } from "../queries/music";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="modal" aria-label={title} onCancel={onClose}>
      <button className="icon-btn close" aria-label="Fechar" onClick={onClose}>
        <X size={20} />
      </button>
      {children}
    </dialog>
  );
}
export function AuthDialog({ onClose }: { onClose: () => void }) {
  const [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const data = { email: String(f.get("email")), password: String(f.get("password")) };
      const result = signup
        ? await authClient.signUp.email({ ...data, name: String(f.get("name")) })
        : await authClient.signIn.email(data);
      if (result.error) setError(result.error.message ?? "Não foi possível entrar.");
      else onClose();
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
      else onClose();
    } catch {
      setError("Não foi possível conectar ao Google.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Sua conta" onClose={onClose}>
      <div className="dialog-logo">
        <Music2 />
      </div>
      <p className="eyebrow blue">BEM-VINDO AO GOSPEL PLAY</p>
      <h2>{signup ? "Sua fé. Sua trilha sonora." : "Que bom ter você por aqui."}</h2>
      <p className="muted">Salve seus louvores e leve sua biblioteca com você.</p>
      <button className="google-btn" onClick={google} disabled={busy}>
        <span className="google-g">G</span> Continuar com Google
      </button>
      <div className="divider">
        <span>ou use seu e-mail</span>
      </div>
      <form onSubmit={submit} className="form-stack">
        {signup && (
          <label>
            Seu nome
            <input
              aria-label="Seu nome"
              name="name"
              autoComplete="name"
              required
              placeholder="Como podemos te chamar?"
            />
          </label>
        )}
        <label>
          E-mail
          <input
            aria-label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@exemplo.com"
          />
        </label>
        <label>
          Senha
          <input
            aria-label="Senha"
            name="password"
            type="password"
            minLength={8}
            autoComplete={signup ? "new-password" : "current-password"}
            required
            placeholder="Pelo menos 8 caracteres"
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-btn" disabled={busy}>
          {busy ? "Conectando…" : signup ? "Criar minha conta" : "Entrar"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="auth-switch">
        {signup ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
        <button
          onClick={() => {
            setSignup(!signup);
            setError("");
          }}
        >
          {signup ? "Entrar" : "Cadastre-se"}
        </button>
      </p>
    </Modal>
  );
}
export function PremiumDialog({
  onClose,
  onActivate,
  premium,
  busy,
}: {
  onClose: () => void;
  onActivate: () => void;
  premium: boolean;
  busy: boolean;
}) {
  return (
    <Modal title="Gospel Play Premium" onClose={onClose}>
      <div className="premium-dialog">
        <Sparkles size={34} />
        <p className="eyebrow">GOSPEL PLAY PREMIUM</p>
        <h2>
          Mais louvor.
          <br />
          Nenhuma interrupção.
        </h2>
        <div className="price">
          R$ 10<span>/mês</span>
        </div>
        <p>Uma trilha sonora para cada momento com Deus.</p>
      </div>
      <div className="benefits">
        {[
          "Ouça sem anúncios",
          "Apoie a música gospel independente",
          "Sua biblioteca no site e no aplicativo",
        ].map((x) => (
          <p key={x}>
            <Check size={18} />
            {x}
          </p>
        ))}
      </div>
      <div className="notice">
        <ShieldCheck size={20} />
        <span>
          <b>Assinatura demonstrativa</b>
          <br />
          Nenhum cartão ou pagamento será solicitado. A cobrança real ainda não está habilitada.
        </span>
      </div>
      <button className="primary-btn" onClick={onActivate} disabled={busy}>
        {busy
          ? "Atualizando…"
          : premium
            ? "Voltar para o plano gratuito"
            : "Experimentar Premium (demo)"}
        <ArrowRight size={17} />
      </button>
    </Modal>
  );
}
export function ArtistPanel({
  isAdmin,
  signedIn,
  onLogin,
}: {
  isAdmin: boolean;
  signedIn: boolean;
  onLogin: () => void;
}) {
  const list = useSubmissions(signedIn),
    submit = useSubmit(),
    moderate = useModerate();
  const [success, setSuccess] = useState(false);
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setSuccess(false);
    try {
      await submit.mutateAsync({
        title: String(f.get("title")),
        artist: String(f.get("artist")),
        audio: String(f.get("audio")),
        cover: String(f.get("cover")),
        duration: Number(f.get("duration")),
        genre: String(f.get("genre")) as "Adoração",
        license: String(f.get("license")),
        source: String(f.get("source")),
        authorized: true,
      });
      setSuccess(true);
      form.reset();
    } catch {}
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow blue">PARA QUEM FAZ MÚSICA</p>
          <h2>Espaço do artista</h2>
          <p className="muted">
            Compartilhe sua mensagem. Envie somente músicas que você tem autorização para
            distribuir.
          </p>
        </div>
        <ShieldCheck className="blue" size={32} />
      </div>
      {!signedIn ? (
        <div className="empty-state">
          <Music2 size={38} />
          <h3>Vamos dar voz ao seu louvor?</h3>
          <p>Entre na sua conta para enviar e acompanhar suas músicas.</p>
          <button className="primary-btn" onClick={onLogin}>
            Entrar para enviar
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={send} className="artist-form card">
            <h3>Enviar música para análise</h3>
            <div className="form-grid">
              {[
                ["title", "Nome da música", "text"],
                ["artist", "Nome do artista", "text"],
                ["audio", "URL pública do áudio (HTTPS)", "url"],
                ["cover", "URL da capa (HTTPS)", "url"],
                ["source", "Link do documento de autorização", "url"],
                ["duration", "Duração em segundos", "number"],
              ].map(([name, label, type]) => (
                <label key={name}>
                  {label}
                  <input aria-label={label} name={name} type={type} required min={1} max={7200} />
                </label>
              ))}
              <label>
                Categoria
                <select name="genre">
                  <option>Adoração</option>
                  <option>Acústico</option>
                  <option>Instrumental</option>
                  <option>Hinos</option>
                </select>
              </label>
              <label>
                Detalhes da licença
                <textarea
                  aria-label="Detalhes da licença"
                  name="license"
                  required
                  minLength={15}
                  placeholder="Titulares, territórios e permissão de distribuição e monetização"
                />
              </label>
            </div>
            <label className="checkbox-label">
              <input
                aria-label="Declaro possuir autorização dos titulares"
                type="checkbox"
                required
              />
              Declaro possuir autorização dos titulares da composição e da gravação.
            </label>
            <p className="muted small">
              Envios ficam pendentes de revisão. A declaração não substitui a verificação dos
              documentos.
            </p>
            {submit.error && <p className="error">{submit.error.message}</p>}
            {success && (
              <p className="success">Música enviada. Aguardando análise de autorização.</p>
            )}
            <button className="primary-btn" disabled={submit.isPending}>
              {submit.isPending ? "Enviando…" : "Enviar para análise"}
            </button>
          </form>
          <h3 className="spaced">{isAdmin ? "Gestão do catálogo" : "Meus envios"}</h3>
          {list.isLoading ? (
            <p>Carregando envios…</p>
          ) : list.error ? (
            <p className="error">{list.error.message}</p>
          ) : !list.data?.length ? (
            <p className="muted">Você ainda não enviou nenhuma música.</p>
          ) : (
            list.data.map((t) => (
              <div className="submission-row" key={t.id}>
                <div>
                  <b>{t.title}</b>
                  <p className="muted">{t.artist}</p>
                </div>
                <span className="pill">
                  {t.status === "published"
                    ? "Publicado"
                    : t.status === "rejected"
                      ? "Rejeitado"
                      : "Em análise"}
                </span>
                {isAdmin && (
                  <>
                    <button
                      className="text-btn"
                      disabled={moderate.isPending}
                      onClick={() => moderate.mutate({ id: t.id, status: "published" })}
                    >
                      Publicar
                    </button>
                    <button
                      className="text-btn"
                      disabled={moderate.isPending}
                      onClick={() => moderate.mutate({ id: t.id, status: "rejected" })}
                    >
                      Rejeitar
                    </button>
                  </>
                )}
              </div>
            ))
          )}
          {!isAdmin && (
            <p className="notice small">
              Publicação disponível somente ao administrador definido no servidor (ADMIN_EMAIL).
            </p>
          )}
          {moderate.error && <p className="error">{moderate.error.message}</p>}
        </>
      )}
    </>
  );
}
