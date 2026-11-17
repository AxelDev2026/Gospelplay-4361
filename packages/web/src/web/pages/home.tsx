import { useState, useEffect, useRef } from "react";
import {
  Home,
  Search,
  Library,
  Heart,
  Plus,
  Music2,
  Compass,
  Headphones,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  ListMusic,
  Sun,
  CloudSun,
  CalendarDays,
  Bell,
  Sparkles,
  Check,
  MoreHorizontal,
  Mic2,
  LogOut,
  X,
  CircleHelp,
  Menu,
} from "lucide-react";
import {
  useCatalog,
  useLibrary,
  useFavorite,
  usePremium,
  useCreatePlaylist,
  useWeather,
} from "../queries/music";
import { authClient } from "../lib/auth";
import { AuthDialog, PremiumDialog, Modal, ArtistPanel } from "../components/dialogs";
type Track = NonNullable<ReturnType<typeof useCatalog>["data"]>[number];
const collections = [
  {
    name: "Manhã com Deus",
    description: "Comece o dia em Sua presença",
    cover: "/images/mountain.jpg",
    tag: "PAZ PARA RECOMEÇAR",
    ids: ["grace-strings", "grace-acoustic", "grace-brass"],
  },
  {
    name: "Momento de adoração",
    description: "Um encontro através da música",
    cover: "/images/worship.jpg",
    tag: "ELE ESTÁ AQUI",
    ids: ["grace-acoustic", "grace-brass", "grace-strings"],
  },
  {
    name: "Paz para a alma",
    description: "Desacelere. Respire. Confie.",
    cover: "/images/peace.jpg",
    tag: "DESCANSE NELE",
    ids: ["grace-strings"],
  },
  {
    name: "Hinos que abraçam",
    description: "A fé que atravessa gerações",
    cover: "/images/praise.jpg",
    tag: "GRAÇA QUE TRANSFORMA",
    ids: ["grace-brass", "grace-acoustic"],
  },
];
const format = (n: number) =>
  `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
function stored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export default function HomePage() {
  const catalog = useCatalog(),
    { data: session } = authClient.useSession(),
    library = useLibrary(!!session),
    favorite = useFavorite(),
    premiumMutation = usePremium(),
    createPlaylist = useCreatePlaylist(),
    weather = useWeather();
  const tracks = catalog.data ?? [];
  const [page, setPage] = useState("Início"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState("grace-strings"),
    [context, setContext] = useState("Manhã com Deus"),
    [queue, setQueue] = useState<string[]>(["grace-strings", "grace-acoustic", "grace-brass"]),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [duration, setDuration] = useState(125),
    [volume, setVolume] = useState(0.7),
    [shuffle, setShuffle] = useState(false),
    [repeat, setRepeat] = useState(false),
    [localFavorites, setLocalFavorites] = useState<string[]>(() => stored("gp-favorites", [])),
    [localPremium, setLocalPremium] = useState(() => stored("gp-premium-demo", false)),
    [modal, setModal] = useState(""),
    [toast, setToast] = useState(""),
    [playlistName, setPlaylistName] = useState(""),
    [sideOpen, setSideOpen] = useState(false),
    [genre, setGenre] = useState("Todos"),
    [date, setDate] = useState(new Date()),
    [weatherError, setWeatherError] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const audio = useRef<HTMLAudioElement>(null),
    shouldPlay = useRef(false);
  const track = tracks.find((t) => t.id === selected) ?? tracks[0];
  const likedIds = session ? (library.data?.favorites ?? []) : localFavorites;
  const premium = session ? (library.data?.premium ?? false) : localPremium;
  useEffect(() => {
    localStorage.setItem("gp-favorites", JSON.stringify(localFavorites));
  }, [localFavorites]);
  useEffect(() => {
    localStorage.setItem("gp-premium-demo", JSON.stringify(localPremium));
  }, [localPremium]);
  useEffect(() => {
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);
  useEffect(() => {
    if (track && audio.current) {
      audio.current.load();
      setTime(0);
      setDuration(track.duration);
      if (shouldPlay.current)
        audio.current.play().catch(() => {
          setToast("Não foi possível reproduzir este áudio.");
          setPlaying(false);
        });
    }
  }, [track]);
  function go(name: string) {
    setPage(name);
    setSearch("");
    setGenre("Todos");
    setSideOpen(false);
  }
  function play(t: Track) {
    shouldPlay.current = true;
    if (t.id === selected) {
      audio.current?.play().catch(() => setToast("Não foi possível reproduzir."));
    } else setSelected(t.id);
  }
  function toggle() {
    if (!track) return;
    if (playing) {
      audio.current?.pause();
      shouldPlay.current = false;
    } else {
      shouldPlay.current = true;
      audio.current?.play().catch(() => setToast("Não foi possível reproduzir o áudio."));
    }
  }
  function next(direction = 1) {
    if (!tracks.length) return;
    const available = queue.filter((id) => tracks.some((t) => t.id === id));
    const ids = available.length ? available : tracks.map((t) => t.id);
    const i = ids.indexOf(selected);
    const target = shuffle
      ? ids[Math.floor(Math.random() * ids.length)]
      : ids[(i + direction + ids.length) % ids.length];
    const t = tracks.find((t) => t.id === target);
    if (t) play(t);
  }
  function like(t: Track) {
    const liked = !likedIds.includes(t.id);
    if (session) favorite.mutate({ id: t.id, liked }, { onError: (e) => setToast(e.message) });
    else setLocalFavorites((prev) => (liked ? [...prev, t.id] : prev.filter((id) => id !== t.id)));
  }
  function chooseCollection(c: (typeof collections)[number]) {
    setContext(c.name);
    setQueue(c.ids);
    const t = tracks.find((t) => t.id === c.ids[0]);
    if (t) play(t);
  }
  function getWeather() {
    setWeatherError("");
    if (!navigator.geolocation) {
      setWeatherError("Localização indisponível");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        weather.mutate(
          { latitude: p.coords.latitude, longitude: p.coords.longitude },
          { onError: () => setWeatherError("Clima indisponível") },
        ),
      () => setWeatherError("Localização não autorizada"),
      { timeout: 10000 },
    );
  }
  async function activate() {
    if (session) {
      try {
        await premiumMutation.mutateAsync({ enabled: !premium });
        setModal("");
        setToast(
          premium ? "Plano gratuito ativado." : "Premium demonstrativo ativado. Nenhuma cobrança.",
        );
      } catch (e) {
        setToast(e instanceof Error ? e.message : "Não foi possível atualizar.");
      }
    } else {
      setLocalPremium(!premium);
      setModal("");
      setToast(
        premium ? "Plano gratuito ativado." : "Premium demonstrativo ativado neste navegador.",
      );
    }
  }
  async function savePlaylist(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      setModal("auth");
      return;
    }
    try {
      await createPlaylist.mutateAsync({ name: playlistName, trackIds: queue });
      setModal("");
      setPlaylistName("");
      setToast("Playlist criada na sua biblioteca.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erro ao criar playlist.");
    }
  }
  const filtered = tracks.filter(
    (t) =>
      (!search ||
        `${t.title} ${t.artist} ${t.genre}`.toLowerCase().includes(search.toLowerCase())) &&
      (genre === "Todos" || t.genre === genre) &&
      (page !== "Favoritos" || likedIds.includes(t.id)),
  );
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" }),
    month = date.toLocaleDateString("pt-BR", { month: "long" });
  function trackRows(items: Track[]) {
    return (
      <div className="track-table">
        {items.length ? (
          items.map((t, i) => (
            <div className={`track-row ${selected === t.id ? "current" : ""}`} key={t.id}>
              <button
                className="track-number"
                aria-label={`Reproduzir ${t.title}`}
                onClick={() => play(t)}
              >
                {selected === t.id && playing ? (
                  <span className="equalizer">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <Play className="row-play" size={15} fill="currentColor" />
                  </>
                )}
              </button>
              <button
                aria-label={`Reproduzir ${t.title}`}
                className="track-info"
                onClick={() => play(t)}
              >
                <img src={t.cover} alt="" />
                <span>
                  <b>{t.title}</b>
                  <small>{t.artist}</small>
                </span>
              </button>
              <span className="track-genre">{t.genre}</span>
              <button
                className={`icon-btn like ${likedIds.includes(t.id) ? "liked" : ""}`}
                aria-label={
                  likedIds.includes(t.id)
                    ? `Remover ${t.title} dos favoritos`
                    : `Favoritar ${t.title}`
                }
                onClick={() => like(t)}
              >
                <Heart size={17} fill={likedIds.includes(t.id) ? "currentColor" : "none"} />
              </button>
              <span className="track-duration">{format(t.duration)}</span>
              <button
                className="icon-btn"
                title="Adicionar à fila"
                aria-label={`Adicionar ${t.title} à fila`}
                onClick={() => {
                  setQueue((q) => [...q, t.id]);
                  setToast("Música adicionada à fila.");
                }}
              >
                <Plus size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Search size={32} />
            <h3>
              {page === "Favoritos"
                ? "Seus louvores favoritos moram aqui"
                : "Nenhuma música encontrada"}
            </h3>
            <p>
              {page === "Favoritos"
                ? "Toque no coração para guardar uma música."
                : "Tente outro nome, artista ou categoria."}
            </p>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${sideOpen ? "open" : ""}`}>
        <a href="/" className="brand">
          <span className="brand-icon">
            <Music2 size={23} />
          </span>
          <span>
            gospel<span className="brand-light">play</span>
            <small>MÚSICA QUE CONECTA</small>
          </span>
        </a>
        <p className="nav-label">SEU ESPAÇO</p>
        <nav>
          {[
            [Home, "Início"],
            [Compass, "Explorar"],
            [Library, "Minha biblioteca"],
            [Heart, "Favoritos"],
          ].map(([Icon, name]) => {
            const C = Icon as typeof Home;
            return (
              <button
                key={String(name)}
                className={page === name ? "active" : ""}
                onClick={() => go(String(name))}
              >
                <C size={20} />
                {String(name)}
                {page === name && <span className="nav-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-label playlists-label">
          SUAS PLAYLISTS
          <button
            className="icon-btn"
            aria-label="Criar playlist"
            onClick={() => setModal(session ? "playlist" : "auth")}
          >
            <Plus size={16} />
          </button>
        </div>
        <button
          className="sidebar-playlist"
          onClick={() => {
            chooseCollection(collections[0]!);
          }}
        >
          <span className="playlist-mini blue-mini">
            <Sun size={17} />
          </span>
          Manhã com Deus
        </button>
        <button className="sidebar-playlist" onClick={() => chooseCollection(collections[1]!)}>
          <span className="playlist-mini pink-mini">
            <Heart size={17} />
          </span>
          Momento de adoração
        </button>
        {library.data?.playlists.map((p) => (
          <button
            className="sidebar-playlist"
            key={p.id}
            onClick={() => {
              setContext(p.name);
              setQueue(JSON.parse(p.trackIds));
              const t = tracks.find((t) => JSON.parse(p.trackIds).includes(t.id));
              if (t) play(t);
            }}
          >
            <span className="playlist-mini">
              <ListMusic size={17} />
            </span>
            {p.name}
          </button>
        ))}
        <button className="create-playlist" onClick={() => setModal(session ? "playlist" : "auth")}>
          <Plus size={16} />
          Criar playlist
        </button>
        <div className="sidebar-bottom">
          <div className="small-premium">
            <span className="premium-icon">
              <Sparkles size={20} />
            </span>
            <h4>Seu louvor, sem pausas.</h4>
            <p>
              Premium por apenas
              <br />
              <b>R$ 10/mês.</b>
            </p>
            <button onClick={() => setModal("premium")}>
              {premium ? "Gerenciar Premium" : "Conhecer Premium"}
              <ArrowUpRight size={15} />
            </button>
            <small>Assinatura demonstrativa</small>
          </div>
          <button
            className={page === "Artistas" ? "utility active" : "utility"}
            onClick={() => go("Artistas")}
          >
            <Mic2 size={18} />
            Espaço do artista
            <ArrowUpRight size={14} />
          </button>
          <button className="utility" onClick={() => setModal("help")}>
            <CircleHelp size={18} />
            Ajuda e informações
          </button>
          <span className="copyright">© {date.getFullYear()} Gospel Play</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-menu"
              aria-label="Abrir menu"
              onClick={() => setSideOpen(!sideOpen)}
            >
              <Menu size={21} />
            </button>
            <Home size={16} />
            <ChevronRight size={14} />
            <span>{page}</span>
          </div>
          <label className="search-box">
            <Search size={18} />
            <input
              ref={searchInput}
              placeholder="O que você quer ouvir hoje?"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (page === "Artistas") setPage("Explorar");
              }}
              aria-label="Buscar músicas e artistas"
            />
            <span>⌘ K</span>
          </label>
          <div className="top-actions">
            <button
              className="icon-btn"
              aria-label="Novidades"
              onClick={() => setToast("Você está em dia! O catálogo independente está chegando.")}
            >
              <Bell size={20} />
              <i className="notification-dot" />
            </button>
            <span className="vertical-divider" />
            {session ? (
              <>
                <button className="profile" onClick={() => setModal("account")}>
                  <span>{session.user.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <b>{session.user.name.split(" ")[0]}</b>
                    <small>{premium ? "Premium · Demo" : "Plano gratuito"}</small>
                  </div>
                  <ChevronDown size={15} />
                </button>
              </>
            ) : (
              <button className="profile" onClick={() => setModal("auth")}>
                <span>G</span>
                <div>
                  <b>Olá, visitante</b>
                  <small>Entrar na minha conta</small>
                </div>
                <ChevronDown size={15} />
              </button>
            )}
          </div>
        </header>
        <main>
          <div className="welcome">
            <div>
              <p className="eyebrow">SUA TRILHA SONORA DE FÉ</p>
              <h1>
                {page === "Início"
                  ? `Que bom ter você aqui${session ? ", " + session.user.name.split(" ")[0] : ""}.`
                  : page === "Explorar"
                    ? "Encontre seu próximo louvor."
                    : page === "Favoritos"
                      ? "Músicas perto do coração."
                      : page === "Minha biblioteca"
                        ? "Sua fé, do seu jeito."
                        : "Sua música tem uma missão."}
              </h1>
              <p className="muted">
                {page === "Início"
                  ? "Uma nova manhã. Um novo motivo para louvar."
                  : "Cada momento merece uma trilha sonora especial."}
              </p>
            </div>
            <span className="welcome-badge">
              <span />
              Música que aproxima de Deus
            </span>
          </div>
          <div className="content-grid">
            <div className="main-content">
              {page === "Início" && !search ? (
                <>
                  <div className="daily-grid">
                    <article className="hero">
                      <img
                        src="/images/sunrise.jpg"
                        alt="Amanhecer dourado entre montanhas e um rio"
                      />
                      <div className="hero-shade" />
                      <div className="hero-content">
                        <span className="hero-label">
                          <Headphones size={14} />
                          SELEÇÃO DO DIA
                        </span>
                        <h2>
                          Comece o dia
                          <br />
                          com o coração em paz.
                        </h2>
                        <p>
                          Louvores para renovar a fé
                          <br />e iluminar a sua manhã.
                        </p>
                        <button onClick={() => chooseCollection(collections[0]!)}>
                          <Play size={16} fill="currentColor" />
                          Ouvir agora
                        </button>
                      </div>
                      <span className="hero-footer">
                        MANHÃ COM DEUS <span>•</span> 3 FAIXAS DEMO
                      </span>
                    </article>
                    <div className="daily-widgets">
                      <article className="date-card card">
                        <div className="widget-label">
                          {month}
                          <CalendarDays size={20} />
                        </div>
                        <h3>{weekday}</h3>
                        <div className="day-strip">
                          {[-1, 0, 1, 2].map((offset) => {
                            const d = new Date(date);
                            d.setDate(d.getDate() + offset);
                            return (
                              <span className={offset === 0 ? "today" : ""} key={offset}>
                                {d.getDate()}
                              </span>
                            );
                          })}
                        </div>
                        <span className="widget-foot">
                          {date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                        </span>
                      </article>
                      <article className="weather-card card">
                        <div className="widget-label">
                          SEU CLIMA
                          <CloudSun size={22} className="blue" />
                        </div>
                        {weather.data ? (
                          <>
                            <h3 className="temperature">
                              {weather.data.temperature}°<small>C</small>
                            </h3>
                            <p>
                              {weather.data.code === 0
                                ? "Céu limpo"
                                : weather.data.code < 4
                                  ? "Parcialmente nublado"
                                  : "Tempo variável"}
                            </p>
                            <button className="weather-link" onClick={getWeather}>
                              Atualizar · Open-Meteo
                            </button>
                          </>
                        ) : (
                          <>
                            <h3 className="weather-title">Lá fora, um novo dia.</h3>
                            <button
                              className="weather-link"
                              onClick={getWeather}
                              disabled={weather.isPending}
                            >
                              {weather.isPending
                                ? "Carregando…"
                                : weatherError || "Ver clima na minha região"}
                              <ChevronRight size={13} />
                            </button>
                            <span className="widget-foot">Ative sua localização</span>
                          </>
                        )}
                      </article>
                    </div>
                  </div>
                  <div className="section-heading">
                    <div>
                      <h2>Para o seu momento</h2>
                      <p className="muted">Uma seleção especial para cada parte do seu dia.</p>
                    </div>
                    <button className="text-btn" onClick={() => go("Explorar")}>
                      Ver tudo
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="playlist-grid">
                    {collections.map((c) => (
                      <button
                        className="playlist-card"
                        key={c.name}
                        onClick={() => chooseCollection(c)}
                      >
                        <div className="playlist-art">
                          <img src={c.cover} alt="" />
                          <div className="playlist-art-shade" />
                          <span className="cover-brand">
                            <Music2 size={14} />
                            gospelplay
                          </span>
                          <strong>
                            {c.tag.split(" ").slice(0, 2).join(" ")}
                            <br />
                            {c.tag.split(" ").slice(2).join(" ")}
                          </strong>
                          <span className="playlist-play">
                            <Play size={18} fill="currentColor" />
                          </span>
                        </div>
                        <b>{c.name}</b>
                        <small>{c.description}</small>
                      </button>
                    ))}
                  </div>
                  <div className="section-heading songs-heading">
                    <div>
                      <h2>Louvores para descobrir</h2>
                      <p className="muted">
                        Graça que atravessa gerações. Ouça nossas faixas de demonstração.
                      </p>
                    </div>
                    <button className="text-btn" onClick={() => go("Explorar")}>
                      Explorar
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {catalog.isLoading ? (
                    <div className="skeleton-list">Carregando seus louvores…</div>
                  ) : catalog.error ? (
                    <div className="notice error">
                      Não foi possível carregar o catálogo.{" "}
                      <button onClick={() => catalog.refetch()}>Tentar novamente</button>
                    </div>
                  ) : (
                    trackRows(tracks)
                  )}
                  <div className="catalog-note">
                    <ShieldNote />
                    Catálogo inicial de demonstração · Gravações de domínio público
                    <button onClick={() => setModal("credits")}>Ver créditos</button>
                  </div>
                </>
              ) : page === "Artistas" ? (
                <ArtistPanel
                  signedIn={!!session}
                  isAdmin={library.data?.isAdmin ?? false}
                  onLogin={() => setModal("auth")}
                />
              ) : (
                <>
                  <div className="section-heading">
                    <div>
                      <h2>
                        {search
                          ? `Resultados para “${search}”`
                          : page === "Minha biblioteca"
                            ? "Suas playlists"
                            : page === "Favoritos"
                              ? "Seus favoritos"
                              : "Explore o catálogo"}
                      </h2>
                      <p className="muted">
                        {search
                          ? `${filtered.length} músicas encontradas`
                          : page === "Minha biblioteca"
                            ? "Guarde os louvores que fazem parte da sua história."
                            : "Gravações de demonstração. Novos artistas independentes em breve."}
                      </p>
                    </div>
                    {page === "Minha biblioteca" && (
                      <button
                        className="primary-btn compact"
                        onClick={() => setModal(session ? "playlist" : "auth")}
                      >
                        <Plus size={16} />
                        Criar playlist
                      </button>
                    )}
                  </div>
                  {page === "Minha biblioteca" && !search && (
                    <>
                      <div className="playlist-grid">
                        {library.data?.playlists.map((p) => (
                          <button
                            className="playlist-card"
                            key={p.id}
                            onClick={() => {
                              setContext(p.name);
                              setQueue(JSON.parse(p.trackIds));
                              const t = tracks.find((t) => JSON.parse(p.trackIds).includes(t.id));
                              if (t) play(t);
                            }}
                          >
                            <div className="custom-playlist">
                              <ListMusic size={52} />
                            </div>
                            <b>{p.name}</b>
                            <small>{JSON.parse(p.trackIds).length} músicas</small>
                          </button>
                        ))}
                      </div>
                      {!library.data?.playlists.length && (
                        <div className="notice">
                          {session
                            ? "Você ainda não criou playlists. Crie uma com a fila atual."
                            : "Entre para salvar suas playlists e acessar a biblioteca em outros dispositivos."}
                          {!session && (
                            <button className="text-btn" onClick={() => setModal("auth")}>
                              Entrar
                            </button>
                          )}
                        </div>
                      )}
                      <h3 className="spaced">Catálogo disponível</h3>
                    </>
                  )}
                  {page === "Explorar" && (
                    <div className="filter-chips">
                      {["Todos", "Instrumental", "Acústico", "Hinos"].map((g) => (
                        <button
                          className={genre === g ? "active" : ""}
                          key={g}
                          onClick={() => setGenre(g)}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  )}
                  {catalog.isLoading ? (
                    <p>Carregando catálogo…</p>
                  ) : catalog.error ? (
                    <div className="notice error">
                      Catálogo indisponível.
                      <button onClick={() => catalog.refetch()}>Tentar novamente</button>
                    </div>
                  ) : (
                    trackRows(filtered)
                  )}
                  {page === "Explorar" && !search && (
                    <>
                      <div className="section-heading">
                        <h2>Encontre seu momento</h2>
                      </div>
                      <div className="playlist-grid">
                        {collections.map((c) => (
                          <button
                            className="playlist-card"
                            key={c.name}
                            onClick={() => chooseCollection(c)}
                          >
                            <div className="playlist-art">
                              <img src={c.cover} alt="" />
                              <div className="playlist-art-shade" />
                              <strong>{c.tag}</strong>
                              <span className="playlist-play">
                                <Play size={18} fill="currentColor" />
                              </span>
                            </div>
                            <b>{c.name}</b>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <aside className="player-column">
              <section className="now-playing card">
                <div className="player-heading">
                  <span className="player-logo">
                    <Music2 size={22} />
                  </span>
                  <div>
                    <span className="eyebrow">TOCANDO DA PLAYLIST</span>
                    <select
                      aria-label="Selecionar playlist"
                      value={context}
                      onChange={(e) => {
                        const c = collections.find((c) => c.name === e.target.value);
                        if (c) chooseCollection(c);
                        else {
                          const p = library.data?.playlists.find((p) => p.name === e.target.value);
                          if (p) {
                            setContext(p.name);
                            setQueue(JSON.parse(p.trackIds));
                          }
                        }
                      }}
                    >
                      {collections.map((c) => (
                        <option key={c.name}>{c.name}</option>
                      ))}
                      {library.data?.playlists.map((p) => (
                        <option key={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <ChevronDown size={18} />
                </div>
                <div className="album-stage">
                  {track ? (
                    <img src={track.cover} className="album-cover" alt={`Capa de ${track.title}`} />
                  ) : (
                    <div className="album-placeholder">
                      <Music2 size={50} />
                    </div>
                  )}
                  <span className="album-tag">GRAÇA QUE TRANSFORMA</span>
                </div>
                <div className="now-title">
                  <div>
                    <h2>{track?.title ?? "Escolha um louvor"}</h2>
                    <p>{track?.artist ?? "Seu momento com Deus"}</p>
                  </div>
                  <button
                    className={`icon-btn like ${track && likedIds.includes(track.id) ? "liked" : ""}`}
                    aria-label="Favoritar música atual"
                    onClick={() => track && like(track)}
                  >
                    <Heart
                      size={21}
                      fill={track && likedIds.includes(track.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <div className="progress">
                  <input
                    aria-label="Posição da reprodução"
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={0.1}
                    value={time}
                    style={
                      { "--progress": `${(time / (duration || 1)) * 100}%` } as React.CSSProperties
                    }
                    onChange={(e) => {
                      if (audio.current) audio.current.currentTime = Number(e.target.value);
                      setTime(Number(e.target.value));
                    }}
                  />
                  <div>
                    <span>{format(time)}</span>
                    <span>{format(duration)}</span>
                  </div>
                </div>
                <div className="player-controls">
                  <button
                    className={`icon-btn ${shuffle ? "blue" : ""}`}
                    aria-label="Reprodução aleatória"
                    aria-pressed={shuffle}
                    onClick={() => setShuffle(!shuffle)}
                  >
                    <Shuffle size={19} />
                  </button>
                  <button
                    className="icon-btn dark"
                    aria-label="Música anterior"
                    onClick={() => next(-1)}
                  >
                    <SkipBack size={22} fill="currentColor" />
                  </button>
                  <button
                    className="play-button"
                    aria-label={playing ? "Pausar" : "Reproduzir"}
                    onClick={toggle}
                  >
                    {playing ? (
                      <Pause size={25} fill="currentColor" />
                    ) : (
                      <Play size={25} fill="currentColor" />
                    )}
                  </button>
                  <button
                    className="icon-btn dark"
                    aria-label="Próxima música"
                    onClick={() => next()}
                  >
                    <SkipForward size={22} fill="currentColor" />
                  </button>
                  <button
                    className={`icon-btn ${repeat ? "blue" : ""}`}
                    aria-label="Repetir música"
                    aria-pressed={repeat}
                    onClick={() => setRepeat(!repeat)}
                  >
                    <Repeat size={19} />
                  </button>
                </div>
                <div className="player-bottom">
                  <span>
                    <span className="live-dot" />
                    {playing ? "EM REPRODUÇÃO" : "SEU MOMENTO DE PAZ"}
                  </span>
                  <button
                    className="icon-btn"
                    aria-label="Créditos da música"
                    onClick={() => setModal("credits")}
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </div>
              </section>
              <section className="queue-card card">
                <div className="section-heading">
                  <h3>A seguir</h3>
                  <button
                    className="icon-btn"
                    aria-label="Ver fila completa"
                    onClick={() => setModal("queue")}
                  >
                    <ListMusic size={19} />
                  </button>
                </div>
                {queue
                  .map((id, i) => ({ t: tracks.find((t) => t.id === id), i }))
                  .filter((x) => x.t && x.i !== queue.indexOf(selected))
                  .slice(0, 2)
                  .map(({ t, i }) => (
                    <button className="queue-track" key={`${t!.id}-${i}`} onClick={() => play(t!)}>
                      <img src={t!.cover} alt="" />
                      <span>
                        <b>{t!.title}</b>
                        <small>{t!.artist.split(" · ")[0]}</small>
                      </span>
                      <Play size={14} />
                    </button>
                  ))}
                <button className="queue-link" onClick={() => setModal("queue")}>
                  Ver fila de reprodução
                  <ChevronRight size={14} />
                </button>
              </section>
              {!premium ? (
                <div className="ad-card">
                  <span className="ad-label">ESPAÇO PUBLICITÁRIO · DEMO</span>
                  <Sparkles size={23} />
                  <h3>Só você e o seu louvor.</h3>
                  <p>
                    Sem anúncios. Sem interrupções.
                    <br />
                    Por apenas <b>R$ 10/mês.</b>
                  </p>
                  <button onClick={() => setModal("premium")}>
                    Conhecer Premium
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="premium-active">
                  <Check size={19} />
                  <div>
                    <b>Seu louvor, sem anúncios.</b>
                    <small>Premium demonstrativo ativado</small>
                  </div>
                </div>
              )}
              <div className="verse">
                <span>UMA PALAVRA PARA HOJE</span>
                <p>
                  “Tudo quanto tem fôlego
                  <br />
                  louve ao Senhor.”
                </p>
                <small>Salmos 150:6</small>
              </div>
            </aside>
          </div>
        </main>
      </div>
      <footer className="bottom-player">
        <div className="bottom-track">
          {track && <img src={track.cover} alt="" />}
          <div>
            <b>{track?.title ?? "Gospel Play"}</b>
            <small>{track?.artist ?? "Música que conecta"}</small>
          </div>
          <button
            className={`icon-btn like ${track && likedIds.includes(track.id) ? "liked" : ""}`}
            aria-label="Salvar música nos favoritos"
            onClick={() => track && like(track)}
          >
            <Heart
              size={18}
              fill={track && likedIds.includes(track.id) ? "currentColor" : "none"}
            />
          </button>
        </div>
        <div className="bottom-middle">
          <button
            className={`icon-btn ${shuffle ? "blue" : ""}`}
            aria-label="Alternar aleatório"
            onClick={() => setShuffle(!shuffle)}
          >
            <Shuffle size={17} />
          </button>
          <button className="icon-btn" aria-label="Anterior" onClick={() => next(-1)}>
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button
            className="bottom-play"
            aria-label={playing ? "Pausar áudio" : "Tocar áudio"}
            onClick={toggle}
          >
            {playing ? (
              <Pause size={17} fill="currentColor" />
            ) : (
              <Play size={17} fill="currentColor" />
            )}
          </button>
          <button className="icon-btn" aria-label="Próximo" onClick={() => next()}>
            <SkipForward size={18} fill="currentColor" />
          </button>
          <div className="mini-progress">
            <span>{format(time)}</span>
            <input
              type="range"
              aria-label="Avançar áudio"
              min={0}
              max={duration || 1}
              value={time}
              style={{ "--progress": `${(time / (duration || 1)) * 100}%` } as React.CSSProperties}
              onChange={(e) => {
                if (audio.current) audio.current.currentTime = Number(e.target.value);
                setTime(Number(e.target.value));
              }}
            />
            <span>{format(duration)}</span>
          </div>
        </div>
        <div className="bottom-tools">
          <button className="icon-btn" aria-label="Abrir fila" onClick={() => setModal("queue")}>
            <ListMusic size={19} />
          </button>
          <button
            className="icon-btn"
            aria-label={volume ? "Silenciar" : "Ativar som"}
            onClick={() => setVolume(volume ? 0 : 0.7)}
          >
            {volume ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <input
            aria-label="Volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            style={{ "--progress": `${volume * 100}%` } as React.CSSProperties}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
          <span className="device-label">
            <span />
            Neste dispositivo
          </span>
        </div>
      </footer>
      <audio
        aria-label="Áudio da música selecionada"
        ref={audio}
        src={track?.audio}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          if (repeat) {
            audio.current!.currentTime = 0;
            audio.current?.play();
          } else next();
        }}
        onError={() => {
          if (shouldPlay.current) {
            setToast("Áudio indisponível. Tente outra música.");
            setPlaying(false);
          }
        }}
      >
        <track
          kind="captions"
          src={`/audio/${track?.genre === "Acústico" ? "acoustic" : "instrumental"}.vtt`}
          srcLang="pt-BR"
          label="Identificação da música"
        />
      </audio>
      {modal === "auth" && <AuthDialog onClose={() => setModal("")} />}{" "}
      {modal === "premium" && (
        <PremiumDialog
          onClose={() => setModal("")}
          onActivate={activate}
          premium={premium}
          busy={premiumMutation.isPending}
        />
      )}{" "}
      {modal === "playlist" && (
        <Modal title="Criar playlist" onClose={() => setModal("")}>
          <div className="dialog-logo">
            <ListMusic />
          </div>
          <h2>Uma playlist com a sua fé.</h2>
          <p className="muted">Vamos salvar as {queue.length} músicas da fila atual.</p>
          <form className="form-stack" onSubmit={savePlaylist}>
            <label>
              Nome da playlist
              <input
                aria-label="Nome da playlist"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                required
                maxLength={60}
                placeholder="Meu momento com Deus"
              />
            </label>
            <button className="primary-btn" disabled={createPlaylist.isPending}>
              {createPlaylist.isPending ? "Salvando…" : "Criar playlist"}
            </button>
          </form>
        </Modal>
      )}
      {modal === "queue" && (
        <Modal title="Fila de reprodução" onClose={() => setModal("")}>
          <p className="eyebrow blue">SUA TRILHA SONORA</p>
          <h2>Fila de reprodução</h2>
          <p className="muted">
            {context} · {queue.length} faixas
          </p>
          {queue.map((id, i) => {
            const t = tracks.find((t) => t.id === id);
            return t ? (
              <div className="queue-modal-row" key={`${id}-${i}`}>
                <button
                  aria-label={`Reproduzir ${t.title}`}
                  className="queue-track"
                  onClick={() => play(t)}
                >
                  <img src={t.cover} alt="" />
                  <span>
                    <b>{t.title}</b>
                    <small>{t.artist}</small>
                  </span>
                </button>
                <button
                  className="icon-btn"
                  aria-label="Mover para cima"
                  disabled={i === 0}
                  onClick={() =>
                    setQueue((q) => {
                      const n = [...q];
                      [n[i - 1], n[i]] = [n[i]!, n[i - 1]!];
                      return n;
                    })
                  }
                >
                  <ChevronLeft size={17} style={{ transform: "rotate(90deg)" }} />
                </button>
                <button
                  className="icon-btn"
                  aria-label="Remover da fila"
                  onClick={() => setQueue((q) => q.filter((_, index) => index !== i))}
                >
                  <X size={17} />
                </button>
              </div>
            ) : null;
          })}
          {!queue.length && (
            <p className="notice">Fila vazia. Adicione faixas pelo botão + no catálogo.</p>
          )}
          <button className="primary-btn" onClick={() => setModal(session ? "playlist" : "auth")}>
            <Plus size={17} />
            Salvar como playlist
          </button>
        </Modal>
      )}
      {modal === "credits" && (
        <Modal title="Créditos do catálogo" onClose={() => setModal("")}>
          <p className="eyebrow blue">MÚSICA COM RESPONSABILIDADE</p>
          <h2>Créditos e licenças</h2>
          <p className="muted">
            Este catálogo inicial contém três gravações de demonstração. Não representa um catálogo
            completo de música gospel.
          </p>
          {tracks.map((t) => (
            <div className="credit-row" key={t.id}>
              <b>{t.title}</b>
              <p>{t.artist}</p>
              <small>{t.license}</small>
              <a href={t.source} target="_blank" rel="noreferrer">
                Fonte e autorização
                <ArrowUpRight size={14} />
              </a>
            </div>
          ))}
          <p className="small muted">
            Fotografias: Unsplash. Clima: Open-Meteo, uso de demonstração não comercial. Para
            operação comercial, contratar plano de clima e validar juridicamente os direitos de cada
            faixa.
          </p>
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="Sobre o Gospel Play" onClose={() => setModal("")}>
          <div className="dialog-logo">
            <Music2 />
          </div>
          <h2>Música que conecta.</h2>
          <p>
            O Gospel Play está sendo preparado para receber artistas gospel independentes com
            autorização de distribuição.
          </p>
          <div className="notice">
            Versão de demonstração: o plano Premium de R$ 10/mês não gera cobranças. Os espaços
            publicitários são ilustrativos.
          </div>
          <h3>Como ouvir</h3>
          <p className="muted">
            Escolha uma música, clique em reproduzir e salve seus favoritos pelo coração. Entre para
            criar playlists e sincronizar sua biblioteca.
          </p>
          <h3>Você é artista?</h3>
          <p className="muted">
            Envie sua música e os documentos pelo Espaço do artista. A publicação depende da revisão
            dos direitos autorais.
          </p>
        </Modal>
      )}
      {modal === "account" && session && (
        <Modal title="Minha conta" onClose={() => setModal("")}>
          <div className="dialog-logo">{session.user.name.charAt(0)}</div>
          <h2>{session.user.name}</h2>
          <p className="muted">{session.user.email}</p>
          <div className="notice">
            {premium
              ? "Premium demonstrativo · R$ 10/mês · sem cobrança"
              : "Plano gratuito · anúncios demonstrativos"}
          </div>
          <button className="primary-btn" onClick={() => setModal("premium")}>
            Gerenciar plano
          </button>
          <button
            className="google-btn"
            onClick={async () => {
              await authClient.signOut();
              setModal("");
            }}
          >
            <LogOut size={18} />
            Sair da conta
          </button>
        </Modal>
      )}
      {toast && (
        <output className="toast">
          <Check size={18} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Fechar mensagem">
            <X size={16} />
          </button>
        </output>
      )}
    </div>
  );
}
function ShieldNote() {
  return <Check size={14} />;
}
