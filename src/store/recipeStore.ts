import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IRecipe } from "../types/recipe";
import { v4 as uuidv4 } from "uuid";

interface RecipeStore {
  recipes: IRecipe[];
  addRecipe: (recipe: IRecipe) => string; // returns new id
  updateRecipe: (id: string, recipe: Partial<IRecipe>) => void;
  deleteRecipe: (id: string) => void;
  getRecipe: (id: string) => IRecipe | undefined;
  getRecipes: () => IRecipe[];
  clearAll: () => void;
}

const generateId = () => (crypto?.randomUUID ? crypto.randomUUID() : uuidv4());

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set, get) => ({
      recipes: [],

      addRecipe: (recipe) => {
        const id = generateId();
        const now = new Date().toISOString();

        const newRecipe: IRecipe = {
          id,
          ...recipe,
          createdAt: recipe.createdAt ?? now,
          updatedAt: now,
        };

        set((state) => ({
          recipes: [...state.recipes, newRecipe],
        }));

        return id;
      },

      updateRecipe: (id, patch) => {
        const now = new Date().toISOString();

        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...patch,
                  updatedAt: now,
                }
              : r
          ),
        }));
      },

      deleteRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        })),

      getRecipe: (id) => {
        return get().recipes.find((r) => r.id === id);
      },

      getRecipes: () => {
        return get().recipes;
      },

      clearAll: () => set({ recipes: [] }),
    }),
    {
      name: "brewlab-recipes",
      version: 1,
    }
  )
);
