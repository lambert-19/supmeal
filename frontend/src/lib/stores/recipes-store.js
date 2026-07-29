import { create } from "zustand"
import { persist } from "zustand/middleware"

const DEMO_RECIPES = [
  {
    id: "recipe-demo-1",
    ownerId: "demo-user",
    title: "Pâtes à la carbonara",
    ingredients: [
      { name: "Spaghetti", quantity: "400", unit: "g" },
      { name: "Lardons fumés", quantity: "200", unit: "g" },
      { name: "Œufs", quantity: "4", unit: "pièce(s)" },
      { name: "Parmesan râpé", quantity: "80", unit: "g" },
      { name: "Poivre noir", quantity: "", unit: "" },
    ],
    steps: [
      { text: "Faire cuire les spaghetti dans une grande casserole d'eau salée." },
      { text: "Pendant ce temps, faire revenir les lardons dans une poêle sans matière grasse." },
      { text: "Battre les œufs avec le parmesan et du poivre dans un saladier." },
      { text: "Égoutter les pâtes en gardant un peu d'eau de cuisson, puis les mélanger hors du feu avec les lardons et l'appareil œufs-parmesan." },
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    tags: ["Italien", "Plat principal", "Rapide"],
    images: [],
    source: "",
    favorite: true,
    createdAt: 1750000000000,
    updatedAt: 1750000000000,
  },
  {
    id: "recipe-demo-2",
    ownerId: "demo-user",
    title: "Salade de quinoa aux légumes rôtis",
    ingredients: [
      { name: "Quinoa", quantity: "200", unit: "g" },
      { name: "Courgette", quantity: "1", unit: "pièce(s)" },
      { name: "Poivron rouge", quantity: "1", unit: "pièce(s)" },
      { name: "Pois chiches cuits", quantity: "240", unit: "g" },
      { name: "Huile d'olive", quantity: "3", unit: "cuillère(s) à soupe" },
      { name: "Citron", quantity: "1/2", unit: "pièce(s)" },
    ],
    steps: [
      { text: "Cuire le quinoa selon les instructions du paquet, puis laisser refroidir." },
      { text: "Couper la courgette et le poivron en dés, les faire rôtir au four 20 minutes avec un filet d'huile d'olive." },
      { text: "Mélanger le quinoa, les légumes rôtis et les pois chiches." },
      { text: "Assaisonner avec l'huile d'olive restante, le jus de citron, sel et poivre." },
    ],
    prepTime: 15,
    cookTime: 20,
    servings: 3,
    tags: ["Végétarien", "Sans gluten", "Entrée"],
    images: [],
    source: "",
    favorite: false,
    createdAt: 1750000100000,
    updatedAt: 1750000100000,
  },
]

function createId() {
  return `recipe-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeRecipe(recipe) {
  if (Array.isArray(recipe.images)) return recipe
  const { imageUrl, ...rest } = recipe
  return { ...rest, images: imageUrl ? [imageUrl] : [] }
}

export const useRecipesStore = create(
  persist(
    (set) => ({
      recipes: [],

      addRecipe(ownerId, data) {
        const recipe = {
          id: createId(),
          ownerId,
          favorite: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...data,
        }
        set((state) => ({ recipes: [recipe, ...state.recipes] }))
        return recipe
      },

      updateRecipe(id, patch) {
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === id ? { ...recipe, ...patch, updatedAt: Date.now() } : recipe
          ),
        }))
      },

      deleteRecipe(id) {
        set((state) => ({ recipes: state.recipes.filter((recipe) => recipe.id !== id) }))
      },

      toggleFavorite(id) {
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe
          ),
        }))
      },
    }),
    {
      name: "supmeal-recipes",
      merge: (persistedState, currentState) => {
        if (!persistedState) return { ...currentState, recipes: DEMO_RECIPES }
        return {
          ...currentState,
          ...persistedState,
          recipes: (persistedState.recipes ?? []).map(normalizeRecipe),
        }
      },
    }
  )
)
