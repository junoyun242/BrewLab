import { Container, Stack, Title } from "@mantine/core";
import RecipeCard from "../components/RecipeCard";
import { useRecipeStore } from "../store/recipeStore";
import { useMemo } from "react";
import type { IRecipe } from "../types/recipe";

const getLastUsedAtIso = (r: IRecipe): string | null => r.lastUsedAt ?? null;

const Home = () => {
  const recipes = useRecipeStore((s) => s.getRecipes());

  const sorted = useMemo(() => {
    const copy = [...recipes];
    copy.sort((a, b) => {
      const aIso = getLastUsedAtIso(a);
      const bIso = getLastUsedAtIso(b);
      if (!aIso && !bIso) return 0;
      if (!aIso) return 1; // no date -> bottom
      if (!bIso) return -1;
      return new Date(bIso).getTime() - new Date(aIso).getTime(); // recent first
    });
    return copy;
  }, [recipes]);

  return (
    <Container size="xs">
      <Stack gap="sm">
        <Title order={5} fw={800} c="white" mt="xs">
          Your Recipes
        </Title>

        {sorted.map((r) => (
          <RecipeCard
            key={r.id}
            id={r.id as string}
            title={r.title}
            brewer={r.brewer}
            lastUsedAt={getLastUsedAtIso(r)}
          />
        ))}
      </Stack>
    </Container>
  );
};

export default Home;
