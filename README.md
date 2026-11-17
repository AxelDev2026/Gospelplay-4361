# App template

Runable copies this Bun and Turborepo project into each new sandbox.

The root package commands are the external contract:

- `bun run dev` starts the web app.
- `bun run dev:desktop` and `bun run dev:mobile` start platform clients.
- `bun run build` builds every package.
- `bun run start` starts or restarts the production server.
- `bun run stop` stops the production server.
- `bun run lint` and `bun run typecheck` validate the project.
- The `db:generate`, `db:migrate`, and `db:push` commands manage the database.

Deployment tools depend on these command names. Their implementations may change, but the names must remain stable.

The web package owns the API, database, and shared web interface. The mobile package is an Expo client. The desktop package is an Electron shell around the web app. Services use the fixed ports defined in `__ports.cjs`, and the web health endpoint is `/api/health`.

Secrets belong in the root `.env` file. Browser values must use the `VITE_` prefix. Commands prefixed with `internal:` are for template maintenance.

## Gospel Play — uso e lançamento

Esta versão inclui site React e app Expo para Android/iOS, com API e banco compartilhados. Interface em português brasileiro.

### Recursos
- Reprodução de áudio real, pausa, próxima/anterior, fila, repetição e modo aleatório.
- Busca, favoritos, playlists criadas com a fila e biblioteca por usuário.
- Cadastro/login por e-mail e senha; login Google gerenciado configurado.
- Plano Premium **demonstrativo** de R$ 10/mês, sem cartão/cobrança; remove espaços publicitários demonstrativos.
- Espaço do artista: submissão de áudio/capa via URLs HTTPS, duração, licença e link da autorização.
- Revisão: todos os envios ficam pendentes. Somente o usuário cujo e-mail coincide com `ADMIN_EMAIL` no `.env` da raiz pode aprovar/rejeitar.
- Data do dispositivo e clima opcional mediante permissão de localização (Open-Meteo, demonstração não comercial).

### Administrador
Crie sua conta pelo site/app. Defina `ADMIN_EMAIL=seu-email` no `.env` **da raiz** e reinicie o serviço web. Nunca conceda papel administrador automaticamente a todo usuário. Revise os documentos dos titulares de composição e fonograma antes de publicar músicas.

### Catálogo inicial
Três gravações de Amazing Grace, com créditos e links de licença disponíveis no player/perfil. Duas gravações instrumentais da USAF Band e uma gravação com voz/violão de Rocks From The Garden, disponibilizadas em domínio público no Wikimedia Commons. Não existe catálogo completo de músicas gospel nem acordos com artistas comerciais nesta versão. Fotografias de Unsplash.

### Antes da operação comercial
1. Formalizar contratos de distribuição e monetização e revisão jurídica das licenças.
2. Configurar o administrador e revisar cada envio antes da publicação.
3. Integrar pagamentos reais, webhooks, controle de assinatura e regras de compra das lojas.
4. Integrar uma rede de anúncios; os espaços atuais são apenas ilustrativos.
5. Preparar termos, privacidade, suporte e exclusão de conta/dados, recuperação de senha e serviços de email.
6. Contratar o plano comercial do serviço de clima, se mantiver esse recurso.
7. Testar em dispositivos Android/iOS físicos. Use a opção de publicação na prévia mobile do Runable, conectando a conta Expo para os builds; não construir APK/IPA no sandbox.

### Verificação realizada
Build web, lint e typecheck de todos os pacotes aprovados. Testes em Chrome web e prévia Expo web: player, busca, favoritos, login/cadastro email, playlists persistentes, assinatura demonstrativa, sincronização web/mobile e bloqueio de moderação para não administradores. Google e dispositivos físicos ainda não testados. Dados de teste removidos.
