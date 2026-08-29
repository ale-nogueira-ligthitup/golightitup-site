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
