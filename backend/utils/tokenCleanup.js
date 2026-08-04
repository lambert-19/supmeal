const prisma = require("./prisma");

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1h

// Un token expiré est déjà rejeté par consumeToken()/consumeCookbookInvite()
// (vérification de expiresAt) — ce nettoyage est une mesure d'hygiène des
// données, pas une protection de sécurité supplémentaire.
async function purgeExpiredTokens() {
  const now = new Date();

  const { count: verificationCount } = await prisma.verificationToken.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  // Les invitations de cookbook ne sont pas une table dédiée : le token vit
  // sur CookbookMember. On ne supprime que les champs de token expirés, pas
  // la ligne (qui reste l'enregistrement de l'invitation elle-même).
  const { count: inviteCount } = await prisma.cookbookMember.updateMany({
    where: { inviteTokenHash: { not: null }, inviteTokenExpiresAt: { lt: now } },
    data: { inviteTokenHash: null, inviteTokenExpiresAt: null },
  });

  if (verificationCount || inviteCount) {
    console.log(
      `[tokenCleanup] ${verificationCount} jeton(s) de vérification/réinitialisation expiré(s) supprimé(s), ${inviteCount} invitation(s) de cookbook expirée(s) nettoyée(s).`
    );
  }

  return { verificationCount, inviteCount };
}

function startTokenCleanupJob() {
  purgeExpiredTokens().catch((err) => console.error("[tokenCleanup] échec :", err));
  return setInterval(() => {
    purgeExpiredTokens().catch((err) => console.error("[tokenCleanup] échec :", err));
  }, CLEANUP_INTERVAL_MS);
}

module.exports = { purgeExpiredTokens, startTokenCleanupJob };
