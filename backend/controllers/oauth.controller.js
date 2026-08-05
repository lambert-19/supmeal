const oauthService = require("../services/oauth.service");
const { getProvider, isProviderConfigured, exchangeCodeForToken } = require("../utils/oauthProviders");
const { OAUTH_FLOW_COOKIE, oauthFlowCookieOptions, generateState, readOAuthFlow } = require("../utils/oauthFlow");
const { signToken, cookieOptions, csrfCookieOptions, generateCsrfToken, CSRF_COOKIE_NAME } = require("../utils/jwt");
const AppError = require("../utils/AppError");

const VALID_PROVIDERS = new Set(["google", "github"]);

function loginErrorUrl(code) {
  return `${process.env.FRONTEND_URL}/login?oauthError=${code}`;
}

function settingsErrorUrl(code) {
  return `${process.env.FRONTEND_URL}/settings?tab=connections&oauthError=${code}`;
}

function settingsSuccessUrl(provider) {
  return `${process.env.FRONTEND_URL}/settings?tab=connections&linked=${provider}`;
}

function redirectUriFor(providerName) {
  return `${process.env.BACKEND_URL}/auth/oauth/${providerName}/callback`;
}

// Deux points d'entrée partagent cette fabrique : GET /auth/oauth/:provider
// (intent="login", public) et GET /auth/oauth/:provider/link (intent="link",
// requireAuth). L'intention et, pour "link", l'id de l'utilisateur courant
// sont embarqués dans le cookie `oauth_flow` — le seul état qui survit
// l'aller-retour chez le fournisseur tiers.
function start(intent) {
  return (req, res) => {
    const providerName = req.params.provider;
    const errorUrl = intent === "link" ? settingsErrorUrl : loginErrorUrl;

    if (!VALID_PROVIDERS.has(providerName)) return res.redirect(errorUrl("unknown_provider"));
    const provider = getProvider(providerName);
    if (!isProviderConfigured(providerName)) return res.redirect(errorUrl("not_configured"));

    const state = generateState();
    const flow = { state, intent, provider: providerName, userId: intent === "link" ? req.user.id : undefined };
    res.cookie(OAUTH_FLOW_COOKIE, JSON.stringify(flow), oauthFlowCookieOptions());

    const authorizeUrl = new URL(provider.authorizeUrl);
    authorizeUrl.searchParams.set("client_id", provider.clientId());
    authorizeUrl.searchParams.set("redirect_uri", redirectUriFor(providerName));
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", provider.scope);
    authorizeUrl.searchParams.set("state", state);
    if (providerName === "google") authorizeUrl.searchParams.set("prompt", "select_account");

    res.redirect(authorizeUrl.toString());
  };
}

// Flux par redirection HTTP, pas une API JSON : chaque échec se traduit par
// une redirection vers le frontend avec un code d'erreur en query param
// plutôt que par une exception remontée à errorHandler.
const callback = async (req, res) => {
  const providerName = req.params.provider;
  const flow = readOAuthFlow(req);
  res.clearCookie(OAUTH_FLOW_COOKIE, { ...oauthFlowCookieOptions(), maxAge: undefined });

  const intent = flow?.intent === "link" ? "link" : "login";
  const errorUrl = intent === "link" ? settingsErrorUrl : loginErrorUrl;

  if (!VALID_PROVIDERS.has(providerName)) return res.redirect(errorUrl("unknown_provider"));
  if (req.query.error) return res.redirect(errorUrl("access_denied"));
  if (!flow || !flow.state || flow.state !== req.query.state || flow.provider !== providerName) {
    return res.redirect(errorUrl("state_mismatch"));
  }

  const provider = getProvider(providerName);
  if (!provider || !isProviderConfigured(providerName)) return res.redirect(errorUrl("not_configured"));

  try {
    const accessToken = await exchangeCodeForToken(provider, req.query.code, redirectUriFor(providerName));
    const profile = await provider.fetchProfile(accessToken);
    if (!profile.email || !profile.emailVerified) return res.redirect(errorUrl("email_unavailable"));

    if (intent === "link") {
      if (!flow.userId) return res.redirect(settingsErrorUrl("oauth_failed"));
      await oauthService.linkAccountToUser(flow.userId, providerName, profile);
      return res.redirect(settingsSuccessUrl(providerName));
    }

    const user = await oauthService.findOrCreateUserFromProfile(providerName, profile);
    const token = signToken(user.id, user.tokenVersion);
    res.cookie(process.env.COOKIE_NAME, token, cookieOptions());
    res.cookie(CSRF_COOKIE_NAME, generateCsrfToken(), csrfCookieOptions());
    return res.redirect(`${process.env.FRONTEND_URL}/recipes`);
  } catch (error) {
    const code = error instanceof AppError && error.statusCode === 409 ? "already_linked" : "oauth_failed";
    return res.redirect(errorUrl(code));
  }
};

module.exports = { start, callback };
