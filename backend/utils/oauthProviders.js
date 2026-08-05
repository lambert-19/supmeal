// Intégration OAuth2 manuelle (fetch natif de Node, pas de librairie tierce) :
// deux fournisseurs seulement, flux "authorization code" classique, et l'état
// anti-CSRF est déjà géré par utils/oauthFlow.js via un cookie plutôt qu'une
// session serveur — introduire express-session juste pour Passport aurait
// été incohérent avec le reste de l'API, entièrement stateless (JWT cookie).
const PROVIDERS = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    async fetchProfile(accessToken) {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Impossible de récupérer le profil Google.");
      const data = await res.json();
      return {
        providerAccountId: data.sub,
        email: data.email || null,
        emailVerified: !!data.email_verified,
        name: data.name || data.email,
      };
    },
  },
  github: {
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    clientId: () => process.env.GITHUB_CLIENT_ID,
    clientSecret: () => process.env.GITHUB_CLIENT_SECRET,
    async fetchProfile(accessToken) {
      const headers = { Authorization: `Bearer ${accessToken}`, "User-Agent": "supmeal-app" };
      const [userRes, emailsRes] = await Promise.all([
        fetch("https://api.github.com/user", { headers }),
        fetch("https://api.github.com/user/emails", { headers }),
      ]);
      if (!userRes.ok) throw new Error("Impossible de récupérer le profil GitHub.");
      const profile = await userRes.json();

      // L'email public du profil peut être absent (paramètre de confidentialité
      // GitHub) — /user/emails donne la liste complète avec le statut de
      // vérification, dont on prend l'adresse principale vérifiée.
      let email = profile.email;
      let emailVerified = false;
      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
        if (primary) {
          email = primary.email;
          emailVerified = true;
        }
      }

      return {
        providerAccountId: String(profile.id),
        email: email || null,
        emailVerified,
        name: profile.name || profile.login,
      };
    },
  },
};

function getProvider(name) {
  return PROVIDERS[name] || null;
}

function isProviderConfigured(name) {
  const provider = PROVIDERS[name];
  return !!(provider && provider.clientId() && provider.clientSecret());
}

async function exchangeCodeForToken(provider, code, redirectUri) {
  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: provider.clientId(),
      client_secret: provider.clientSecret(),
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.access_token) throw new Error("Échec de l'échange du code OAuth2.");
  return data.access_token;
}

module.exports = { getProvider, isProviderConfigured, exchangeCodeForToken };
