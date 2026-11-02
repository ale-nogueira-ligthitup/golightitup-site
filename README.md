# Light It Up — golightitup.com

Landing page de uma tela do movimento **Light It Up**, de Alessandra Nogueira (Ale Light It Up).
Substitui a página antiga do GoDaddy Website Builder.

## Stack
- Um único arquivo `index.html` autossuficiente (CSS inline no `<head>`).
- Google Fonts (Fraunces + Mulish) via `<link>`.
- Zero build, zero dependência de JS, zero imagem externa. SVG da chama inline.

## Identidade visual
- Paleta "Brasa & Chama": fundo Brasa `#211436`, texto Luz `#FAF4EA`, gradiente chama `linear-gradient(165deg, #FF6A2B 0%, #F5B13C 100%)`.
- Tipografia: Fraunces (títulos serifados) + Mulish (corpo).
- Símbolo: SVG de chama em traço contínuo com nó de elo na base (placeholder do selo final).

## Placeholders a trocar quando os assets finais existirem
- `.photo-frame` na seção X39 → foto real da Ale aplicando o X39 (`<img>`).
- SVG `#flameMark` no rodapé → selo final do movimento quando estiver pronto.
- Favicon (emoji chama) e Open Graph image → arte final.

## Publicar na Vercel (estático)
1. `git init && git add -A && git commit -m "Light It Up landing"`
2. Criar repo no GitHub e dar push.
3. Na Vercel: New Project → importar o repo. Framework Preset = **Other**. Sem build command, output root = raiz. Deploy.
4. Em Domains, adicionar `golightitup.com` e `www.golightitup.com`.
5. Como os nameservers ficam no GoDaddy (domaincontrol), **não** mudar nameservers. No DNS do GoDaddy criar:
   - `A` em `@` → `76.76.21.21` (IP da Vercel)
   - `CNAME` em `www` → `cname.vercel-dns.com`
   - **NÃO tocar nos registros MX / TXT de email.** Só mexer em A e CNAME de web.

## Isca "Peptídeos sem mistério" (branch `isca-peptideos`)
| Arquivo | O que é |
|---|---|
| `peptideos.html` | Página de captura (nome, e-mail, país, interesse, consentimento desmarcado). Não está linkada na `index.html`. |
| `api/inscrever.js` | Função serverless da Vercel (Node, `fetch` nativo). Valida e chama a Brevo com confirmação dupla (`/v3/contacts/doubleOptinConfirmation`) para todos os países. |
| `peptideos-obrigada.html` | Página após o clique de confirmação (noindex). Sem menção à LifeWave, porque contatos do Brasil também caem aqui. |
| `guia-peptideos.html` | Guia versão A (noindex, sem link no site, CSS de impressão). |
| `guia-peptideos-b.html` | Guia versão B, para quem marcou Brasil: sem LifeWave, sem X39, sem hashtag. |
| `vercel.json` | Cabeçalho `X-Robots-Tag: noindex` nas páginas do guia e de obrigada. |

### Variáveis de ambiente (Vercel → Settings → Environment Variables)
- `BREVO_API_KEY` (obrigatória; nunca no código nem no repositório)
- `BREVO_DOI_TEMPLATE_ID` (obrigatória; id numérico do template de confirmação dupla)
- `BREVO_DOI_REDIRECT` (opcional; padrão `https://golightitup.com/peptideos-obrigada.html`)
- `BREVO_LIST_ID` (opcional; padrão `6`, lista "Isca Peptídeos")

### Atributos gravados na Brevo
`FIRSTNAME`, `PAIS` (US, CA, MX, PT, EU, JP, AU, NZ, ASIA, BR, OUTRO), `PAIS_OUTRO` (texto livre, só se existir na conta), `INTERESSE` (cuidar_fase, envelhecer_qv, ciencia, construir_algo), `ORIGEM` = "Isca Peptídeos", `TRILHO` (BRASIL se PAIS=BR; OPORTUNIDADE se construir_algo fora do Brasil; senão CLIENTE), `CONSENTIMENTO` (texto + data/hora ISO), `DATA_CADASTRO` (data de Orlando).

Proteções: honeypot (`empresa`), checagem de origem, nenhum log com e-mail, nome ou chave. Sem JavaScript, o formulário nativo também funciona (volta para `#enviado` ou `#erro`).
