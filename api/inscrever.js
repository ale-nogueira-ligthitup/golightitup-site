/**
 * POST /api/inscrever
 *
 * Recebe o formulário da isca "Peptídeos sem mistério" (peptideos.html),
 * valida e cria o contato na Brevo com CONFIRMAÇÃO DUPLA (todos os países).
 * O contato só entra na lista "Isca Peptídeos" (id 6) depois de clicar no
 * link do e-mail de confirmação.
 *
 * Variáveis de ambiente (Vercel → Settings → Environment Variables):
 *   BREVO_API_KEY          chave de API da Brevo (obrigatória, nunca no código)
 *   BREVO_DOI_TEMPLATE_ID  id numérico do template de confirmação dupla (obrigatória)
 *   BREVO_DOI_REDIRECT     URL após o clique de confirmação
 *                          (padrão https://golightitup.com/peptideos-obrigada.html)
 *   BREVO_LIST_ID          opcional, padrão 6 (Isca Peptídeos)
 *
 * Privacidade: nenhum log com e-mail, nome ou chave. Só códigos de status.
 */

const BREVO_DOI_URL = "https://api.brevo.com/v3/contacts/doubleOptinConfirmation";
const DEFAULT_REDIRECT = "https://golightitup.com/peptideos-obrigada.html";
const DEFAULT_LIST_ID = 6;

const PAISES = new Set(["US", "CA", "MX", "PT", "EU", "JP", "AU", "NZ", "ASIA", "BR", "OUTRO"]);
const INTERESSES = new Set(["cuidar_fase", "envelhecer_qv", "ciencia", "construir_algo"]);
const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;

const ALLOWED_HOSTS = [/^golightitup\.com$/, /^www\.golightitup\.com$/, /\.vercel\.app$/, /^localhost(:\d+)?$/, /^127\.0\.0\.1(:\d+)?$/];

function clean(value, max) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function isChecked(value) {
  return value === true || value === "true" || value === "on" || value === "sim" || value === "1";
}

function trilhoPara(pais, interesse) {
  if (pais === "BR") return "BRASIL"; // PAIS = Brasil manda sobre INTERESSE
  if (interesse === "construir_algo") return "OPORTUNIDADE";
  return "CLIENTE";
}

function dataHojeNY(now) {
  // AAAA-MM-DD no fuso da Ale (Orlando, America/New_York)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function readBody(req) {
  const body = req.body;
  if (body && typeof body === "object") return body;
  if (typeof body === "string" && body.length) {
    const type = String(req.headers["content-type"] || "");
    try {
      if (type.includes("application/json")) return JSON.parse(body);
      return Object.fromEntries(new URLSearchParams(body));
    } catch (_) {
      return {};
    }
  }
  return {};
}

function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // envio sem JavaScript (form nativo) ou ferramenta de teste
  try {
    const host = new URL(origin).host;
    return ALLOWED_HOSTS.some((re) => re.test(host));
  } catch (_) {
    return false;
  }
}

function wantsJson(req) {
  const accept = String(req.headers.accept || "");
  const type = String(req.headers["content-type"] || "");
  return accept.includes("application/json") || type.includes("application/json");
}

function reply(req, res, status, payload) {
  if (wantsJson(req)) {
    res.status(status).json(payload);
    return;
  }
  // Envio sem JavaScript: volta para a página com a mensagem certa (âncora :target)
  const anchor = payload.ok ? "enviado" : "erro";
  res.setHeader("Location", `/peptideos.html#${anchor}`);
  res.status(303).end();
}

async function chamarBrevo(apiKey, payload) {
  const resp = await fetch(BREVO_DOI_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  let data = null;
  try {
    data = await resp.json();
  } catch (_) {
    data = null;
  }
  return { status: resp.status, ok: resp.ok, code: data && data.code, message: data && data.message };
}

async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, erro: "metodo" });
    return;
  }

  if (!originAllowed(req)) {
    res.status(403).json({ ok: false, erro: "origem" });
    return;
  }

  const body = readBody(req);

  // Honeypot: campo invisível para pessoas. Robô preenche, recebe "sucesso" e nada é gravado.
  if (clean(body.empresa, 200)) {
    reply(req, res, 200, { ok: true });
    return;
  }

  const email = clean(body.email, 254).toLowerCase();
  const nome = clean(body.nome, 60);
  const pais = clean(body.pais, 10).toUpperCase();
  const paisOutro = pais === "OUTRO" ? clean(body.pais_outro, 60) : "";
  const interesse = clean(body.interesse, 30);
  const consentiu = isChecked(body.consentimento);

  if (!EMAIL_RE.test(email)) return reply(req, res, 400, { ok: false, erro: "email" });
  if (!PAISES.has(pais)) return reply(req, res, 400, { ok: false, erro: "pais" });
  if (!INTERESSES.has(interesse)) return reply(req, res, 400, { ok: false, erro: "interesse" });
  if (!consentiu) return reply(req, res, 400, { ok: false, erro: "consentimento" });

  const apiKey = process.env.BREVO_API_KEY;
  const templateId = parseInt(process.env.BREVO_DOI_TEMPLATE_ID || "", 10);
  const redirectionUrl = process.env.BREVO_DOI_REDIRECT || DEFAULT_REDIRECT;
  const listId = parseInt(process.env.BREVO_LIST_ID || "", 10) || DEFAULT_LIST_ID;

  if (!apiKey || !Number.isInteger(templateId)) {
    console.error("[inscrever] configuração ausente (BREVO_API_KEY ou BREVO_DOI_TEMPLATE_ID)");
    return reply(req, res, 500, { ok: false, erro: "servidor" });
  }

  const now = new Date();
  const attributes = {
    PAIS: pais,
    INTERESSE: interesse,
    ORIGEM: "Isca Peptídeos",
    TRILHO: trilhoPara(pais, interesse),
    CONSENTIMENTO: `Formulário golightitup.com/peptideos, caixa marcada pela pessoa, confirmação dupla enviada · ${now.toISOString()}`,
    DATA_CADASTRO: dataHojeNY(now),
  };
  if (nome) attributes.FIRSTNAME = nome;
  if (paisOutro) attributes.PAIS_OUTRO = paisOutro;

  const payload = { email, attributes, includeListIds: [listId], templateId, redirectionUrl };

  try {
    let result = await chamarBrevo(apiKey, payload);

    // PAIS_OUTRO é opcional: se o atributo ainda não existir na Brevo, tenta de novo sem ele.
    if (!result.ok && result.status === 400 && attributes.PAIS_OUTRO) {
      delete attributes.PAIS_OUTRO;
      result = await chamarBrevo(apiKey, payload);
    }

    if (result.ok) return reply(req, res, 200, { ok: true });

    console.error(`[inscrever] Brevo respondeu ${result.status} ${result.code || ""}`.trim());
    if (result.status === 400 && /email/i.test(String(result.message || ""))) {
      return reply(req, res, 400, { ok: false, erro: "email" });
    }
    return reply(req, res, 502, { ok: false, erro: "servidor" });
  } catch (err) {
    console.error(`[inscrever] falha de rede ao chamar a Brevo: ${err && err.name}`);
    return reply(req, res, 502, { ok: false, erro: "servidor" });
  }
}

module.exports = handler;
module.exports.trilhoPara = trilhoPara;
module.exports.dataHojeNY = dataHojeNY;
