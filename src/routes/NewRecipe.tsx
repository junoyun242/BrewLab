/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState, type FC } from "react";
import {
  Container,
  Stack,
  Title,
  TextInput,
  ScrollArea,
  Group,
  Button,
  Card,
  Text,
  Badge,
  Divider,
  useMantineTheme,
  NumberInput,
  ActionIcon,
  Textarea,
  Center,
  Loader,
} from "@mantine/core";
import { useRouter, useSearch } from "@tanstack/react-router";
import { BREWERS, BREWER_MAP } from "../data/brewers";
import type { BrewerId, IStep } from "../types/recipe";
import { IconCoffee, IconPlus, IconTrash } from "@tabler/icons-react";
import { useRecipeStore } from "../store/recipeStore";

interface IBrewerPill {
  id: BrewerId;
  label?: string;
  selected: boolean;
  onSelect: (id: BrewerId) => void;
}

const BrewerPill: FC<IBrewerPill> = ({ id, label, selected, onSelect }) => {
  const theme = useMantineTheme();
  const def = BREWER_MAP[id];
  const Icon = def.icon;
  const text = label ?? def.label;

  return (
    <Button
      onClick={() => onSelect(id)}
      variant={selected ? "filled" : "default"}
      color="yellow"
      radius="xl"
      w="auto"
      h={34}
      pl="xs"
      pr="sm"
      style={{ whiteSpace: "nowrap", flex: "0 0 auto" }}
      size="compact-sm"
      leftSection={<Icon size={16} />}
      styles={{
        root: {
          backgroundColor: selected
            ? theme.colors.yellow[6]
            : theme.colors.dark[6],
          border: `1px solid ${theme.colors.dark[5]}`,
        },
        label: {
          color: theme.white,
          fontWeight: 600,
        },
      }}
    >
      {text}
    </Button>
  );
};

const BrewerPreview = ({
  brewer,
  brewerId,
}: {
  brewer: string;
  brewerId?: BrewerId;
}) => {
  const theme = useMantineTheme();
  const def = brewerId ? BREWER_MAP[brewerId] : undefined;
  const Icon = def?.icon ?? IconCoffee;

  return (
    <Card
      withBorder
      radius="lg"
      p="md"
      styles={{
        root: {
          backgroundColor: theme.colors.dark[7],
          borderColor: theme.colors.dark[5],
        },
      }}
    >
      <Group gap="xs" align="center">
        <Icon size={18} />
        <Text fw={700}>{brewer || "—"}</Text>
        <Badge size="sm" variant="light" color={brewerId ? "yellow" : "gray"}>
          {brewerId ? "PRESET" : "CUSTOM"}
        </Badge>
      </Group>
    </Card>
  );
};

const StepsEditor: FC<{
  steps: IStep[];
  onChange: (next: IStep[]) => void;
}> = ({ steps, onChange }) => {
  const theme = useMantineTheme();

  const update = (idx: number, patch: Partial<IStep>) => {
    const next = steps.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(next);
  };

  const remove = (idx: number) => {
    if (steps.length === 1) return;
    const next = steps
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, step: i + 1 }));
    onChange(next);
  };

  const addStep = () => {
    onChange([...steps, { step: steps.length + 1, text: "", duration: 30 }]);
  };

  return (
    <Stack gap="sm">
      {steps.map((s, i) => (
        <Card
          key={i}
          withBorder
          radius="lg"
          p="md"
          styles={{
            root: {
              backgroundColor: theme.colors.dark[7],
              borderColor: theme.colors.dark[5],
            },
          }}
        >
          <Group justify="space-between" align="center" mb="xs">
            <Group gap="xs">
              <Badge color="yellow" variant="light">
                Step {s.step}
              </Badge>
            </Group>
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label="Remove step"
              onClick={() => remove(i)}
              disabled={steps.length === 1}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>

          <Stack gap="xs">
            <Textarea
              label="Instruction"
              placeholder="e.g., Bloom with 30g water"
              value={s.text}
              onChange={(e) => update(i, { text: e.currentTarget.value })}
              autosize
              minRows={2}
              variant="filled"
              styles={{
                input: {
                  backgroundColor: theme.colors.dark[6],
                  borderColor: theme.colors.dark[5],
                },
              }}
            />

            <NumberInput
              label="Duration (seconds)"
              min={1}
              step={5}
              value={s.duration || ""}
              onChange={(val) => update(i, { duration: Number(val) || 0 })}
              variant="filled"
              styles={{
                input: {
                  backgroundColor: theme.colors.dark[6],
                  borderColor: theme.colors.dark[5],
                },
              }}
            />
          </Stack>
        </Card>
      ))}

      <Button
        onClick={addStep}
        leftSection={<IconPlus size={16} />}
        variant="outline"
        color="yellow"
        radius="md"
      >
        Add step
      </Button>
    </Stack>
  );
};

const NewRecipe = () => {
  const theme = useMantineTheme();
  const router = useRouter();
  const { id } = useSearch({ from: "/new-recipe" });
  const editMode = !!id;

  const originalRecipe = useRecipeStore((s) =>
    id ? s.getRecipe(id) : undefined
  );
  const hasHydrated = useRecipeStore.persist?.hasHydrated?.() ?? true; // zustand v4 persist helper

  const [title, setTitle] = useState("");
  const [brewer, setBrewer] = useState("");
  const [brewerId, setBrewerId] = useState<BrewerId | undefined>(undefined);
  const [steps, setSteps] = useState<IStep[]>([
    { step: 1, text: "", duration: 30 },
  ]);

  const canSave = useMemo(() => {
    const hasTitle = !!title.trim();
    const hasBrewer = !!brewer.trim();
    const hasAtLeastOneStep = steps.length > 0 && !!steps[0].text.trim();
    return hasTitle && hasBrewer && hasAtLeastOneStep;
  }, [title, brewer, steps]);

  const onCustomChange = (val: string) => {
    setBrewer(val);
    setBrewerId(undefined);
  };

  const handleCreate = () => {
    if (!canSave) return;

    const now = new Date().toISOString();

    if (editMode && originalRecipe) {
      useRecipeStore.getState().updateRecipe(id!, {
        title,
        brewer,
        brewerId,
        steps,
        createdAt: originalRecipe.createdAt, // keep original
        updatedAt: now,
        lastUsedAt: originalRecipe.lastUsedAt ?? null,
      });
    } else {
      useRecipeStore.getState().addRecipe({
        title,
        brewer,
        brewerId,
        steps,
        createdAt: now,
        updatedAt: now,
        lastUsedAt: null,
      });
    }

    router.navigate({ to: "/" });
  };

  useEffect(() => {
    if (editMode && originalRecipe) {
      setTitle(originalRecipe.title);
      setBrewer(originalRecipe.brewer);
      setBrewerId(originalRecipe.brewerId as BrewerId | undefined);
      setSteps(
        originalRecipe.steps?.length
          ? originalRecipe.steps.map((s, i) => ({ ...s, step: i + 1 }))
          : [{ step: 1, text: "", duration: 30 }]
      );
    }
    if (!editMode) {
      setTitle("");
      setBrewer("");
      setBrewerId(undefined);
      setSteps([{ step: 1, text: "", duration: 30 }]);
    }
  }, [editMode, originalRecipe?.id]);

  if (!hasHydrated) {
    return (
      <Center h={200}>
        <Loader color="yellow" />
      </Center>
    );
  }

  if (editMode && !originalRecipe) {
    return (
      <Container size="xs">
        <Stack gap="md" mt="md">
          <Title order={4}>Recipe not found</Title>
          <Button
            onClick={() => router.navigate({ to: "/" })}
            variant="outline"
            color="yellow"
          >
            Go home
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xs">
      <Stack gap="md">
        <Title order={4} fw={800} c="white" mt="xs">
          {editMode ? "Edit Recipe" : "New Recipe"}
        </Title>

        <TextInput
          label="Title"
          placeholder="e.g., James Hoffmann V60"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          variant="filled"
          styles={{
            input: {
              backgroundColor: theme.colors.dark[7],
              borderColor: theme.colors.dark[5],
            },
          }}
        />

        <TextInput
          label="Brewer (custom)"
          placeholder="Type any brewer…"
          value={brewer}
          onChange={(e) => onCustomChange(e.currentTarget.value)}
          description="Or pick a preset below"
          variant="filled"
          styles={{
            input: {
              backgroundColor: theme.colors.dark[7],
              borderColor: theme.colors.dark[5],
            },
          }}
        />

        <Divider label="Popular brewers" labelPosition="center" />

        <ScrollArea type="auto" scrollbarSize={6}>
          <Group wrap="nowrap" gap="xs" pb={6}>
            {BREWERS.map((b) => (
              <BrewerPill
                key={b.id}
                id={b.id}
                label={b.label}
                selected={brewerId === b.id}
                onSelect={(id) => {
                  setBrewerId(id);
                  setBrewer(BREWER_MAP[id].label);
                }}
              />
            ))}
          </Group>
        </ScrollArea>

        <BrewerPreview brewer={brewer} brewerId={brewerId} />
        <StepsEditor steps={steps} onChange={setSteps} />

        <Button
          onClick={handleCreate}
          color="yellow"
          radius="md"
          disabled={!canSave}
        >
          {editMode ? "Save changes" : "Create recipe"}
        </Button>
      </Stack>
    </Container>
  );
};

export default NewRecipe;
