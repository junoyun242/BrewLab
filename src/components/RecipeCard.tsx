import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import { IconChevronRight, IconPencil, IconTrash } from "@tabler/icons-react";
import { useRouter } from "@tanstack/react-router";
import { useRecipeStore } from "../store/recipeStore";
import dayjs from "dayjs";

type Props = {
  id: string;
  title: string;
  brewer: string;
  lastUsedAt?: string | null;
};

const RecipeCard = ({ id, title, brewer, lastUsedAt }: Props) => {
  const theme = useMantineTheme();
  const router = useRouter();
  const { updateRecipe, deleteRecipe } = useRecipeStore();

  const handleBrew = () => {
    updateRecipe(id, { lastUsedAt: new Date().toISOString() });
    router.navigate({ to: `/brew/${id}` });
  };

  const handleEdit = () => {
    router.navigate({ to: `/new-recipe?id=${id}` });
  };

  const handleDelete = () => {
    if (confirm(`Delete “${title}”? This cannot be undone.`)) {
      deleteRecipe(id);
    }
  };

  return (
    <Card
      withBorder
      radius="lg"
      shadow="xs"
      p="md"
      styles={{
        root: {
          backgroundColor: theme.colors.dark[7],
          borderColor: theme.colors.dark[5],
        },
      }}
    >
      <Stack gap={6}>
        <Group justify="space-between" align="flex-start">
          <Text fw={700} size="lg" c="white">
            {title}
          </Text>
          <Badge variant="light" color="yellow" radius="sm">
            {brewer}
          </Badge>
        </Group>

        {lastUsedAt && (
          <Text size="xs" c="gray.5">
            Last brewed: {dayjs(lastUsedAt).format("YYYY-MM-DD HH:mm")}
          </Text>
        )}

        <Group justify="space-between" mt={6}>
          <Group gap="xs">
            <Button
              variant="default"
              size="xs"
              leftSection={<IconPencil size={14} />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button
              variant="subtle"
              color="red"
              size="xs"
              leftSection={<IconTrash size={14} />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Group>

          <Button
            color="yellow"
            radius="md"
            rightSection={<IconChevronRight size={16} />}
            size="sm"
            onClick={handleBrew}
          >
            Brew
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

export default RecipeCard;
