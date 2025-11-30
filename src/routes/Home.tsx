import {
  Container,
  Stack,
  Title,
  Group,
  Button,
  Card,
  Text,
  Center,
  FileButton,
  Badge,
} from "@mantine/core";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import RecipeCard from "../components/RecipeCard";
import { useRecipeStore } from "../store/recipeStore";
import type { IRecipe } from "../types/recipe";
import { generateId } from "../utils";

type ImportShape = Partial<IRecipe> & { id?: string };
const getLastUsedAtIso = (r: IRecipe): string | null => r.lastUsedAt ?? null;

const Home = () => {
  const recipes = useRecipeStore((s) => s.getRecipes());

  const sorted = useMemo(() => {
    const copy = [...recipes];
    copy.sort((a, b) => {
      const aIso = getLastUsedAtIso(a);
      const bIso = getLastUsedAtIso(b);
      if (!aIso && !bIso) return 0;
      if (!aIso) return 1;
      if (!bIso) return -1;
      return new Date(bIso).getTime() - new Date(aIso).getTime();
    });
    return copy;
  }, [recipes]);

  const handleExport = () => {
    const data = JSON.stringify(sorted, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ymd = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `brewlab-recipes-${ymd}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const arr = JSON.parse(text) as ImportShape[] | ImportShape;
      const input = Array.isArray(arr) ? arr : [arr];

      const store = useRecipeStore.getState();
      input.forEach((raw) => {
        if (!raw || typeof raw !== "object") return;
        const id = raw.id || generateId();

        const clean: IRecipe = {
          id,
          title: raw.title || "",
          brewer: raw.brewer ?? "Custom",
          brewerId: raw.brewerId,
          steps:
            Array.isArray(raw.steps) && raw.steps.length
              ? raw.steps.map((s, i) => ({
                  step: s?.step ?? i + 1,
                  text: s?.text ?? "",
                  duration: Number(s?.duration) || 0,
                }))
              : [{ step: 1, text: "", duration: 30 }],
          createdAt: raw.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastUsedAt: raw.lastUsedAt ?? null,
        } as IRecipe;

        const existing = store.getRecipe(id as string);
        if (existing) {
          store.updateRecipe(id as string, clean);
        } else {
          store.addRecipe(clean);
        }
      });
    } catch (e) {
      console.error("Import failed", e);
    }
  };

  return (
    <Container size="xs">
      <Stack gap="sm">
        <Group justify="space-between" align="center" mt="xs">
          <Title order={5} fw={800} c="white">
            Your Recipes
          </Title>
          <Group gap="xs">
            <FileButton onChange={handleImport} accept="application/json,.json">
              {(props) => (
                <Button variant="default" radius="md" {...props}>
                  Import
                </Button>
              )}
            </FileButton>
            <Button variant="light" radius="md" onClick={handleExport}>
              Export
            </Button>
            <Button
              component={Link}
              to="/new-recipe"
              color="yellow"
              radius="md"
            >
              New
            </Button>
          </Group>
        </Group>

        {sorted.length === 0 ? (
          <Center mt="sm">
            <Card
              withBorder
              radius="lg"
              p="lg"
              styles={(theme) => ({
                root: {
                  backgroundColor: theme.colors.dark[7],
                  borderColor: theme.colors.dark[5],
                },
              })}
            >
              <Stack gap="sm" align="center">
                <Badge color="yellow" variant="light">
                  Welcome
                </Badge>
                <Text c="gray.3" ta="center">
                  You don’t have any recipes yet.
                  <br />
                  Create a new one or import a JSON file.
                </Text>
                <Group>
                  <Button
                    component={Link}
                    to="/new-recipe"
                    color="yellow"
                    radius="md"
                  >
                    Create recipe
                  </Button>
                  <FileButton
                    onChange={handleImport}
                    accept="application/json,.json"
                  >
                    {(props) => (
                      <Button variant="outline" radius="md" {...props}>
                        Import JSON
                      </Button>
                    )}
                  </FileButton>
                </Group>
              </Stack>
            </Card>
          </Center>
        ) : (
          sorted.map((r) => (
            <RecipeCard
              key={r.id}
              id={r.id as string}
              title={r.title}
              brewer={r.brewer}
              lastUsedAt={getLastUsedAtIso(r)}
            />
          ))
        )}
      </Stack>
    </Container>
  );
};

export default Home;
