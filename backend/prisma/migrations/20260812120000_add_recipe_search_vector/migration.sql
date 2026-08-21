-- Colonne generee (titre + tags + source), utilisee par la recherche plein
-- texte de GET /recipes?q= (recipes.service.js#findMatchingRecipeIds) a la
-- place d'un filtrage cote application sur l'ensemble des recettes chargees.
--
-- to_tsvector('french', ...) ne peut pas etre utilise directement dans
-- l'expression d'une colonne GENERATED : la conversion du texte litteral
-- 'french' en regconfig depend du catalogue pg_ts_config, donc Postgres la
-- considere non-immutable. On l'enveloppe dans une fonction SQL marquee
-- IMMUTABLE (config figee en dur dans le corps de la fonction) pour lever
-- le blocage - pattern standard pour cette erreur (42P17).
CREATE FUNCTION recipe_search_text(title text, tags text[], source text) RETURNS tsvector AS $$
  SELECT to_tsvector('french', coalesce(title, '') || ' ' || coalesce(array_to_string(tags, ' '), '') || ' ' || coalesce(source, ''));
$$ LANGUAGE sql IMMUTABLE;

ALTER TABLE "Recipe"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (recipe_search_text("title", "tags", "source")) STORED;

CREATE INDEX "Recipe_searchVector_idx" ON "Recipe" USING GIN ("searchVector");
