/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Container,
  Stack,
  Group,
  Title,
  Text,
  Card,
  Button,
  ActionIcon,
  Progress,
  Badge,
  useMantineTheme,
  Center,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconPlayerPlay,
  IconPlayerPause,
  IconSquare,
  IconChevronRight,
  IconChevronDown,
  IconClock,
} from "@tabler/icons-react";
import { useParams, Link } from "@tanstack/react-router";
import { useRecipeStore } from "../store/recipeStore";

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function BrewPage() {
  const theme = useMantineTheme();
  const { id } = useParams({ from: "/brew/$id" });
  const { updateRecipe } = useRecipeStore();
  const recipe = useRecipeStore((s) => s.getRecipe(id));

  const steps = recipe?.steps ?? [];
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState<number>(steps[0]?.duration ?? 0);
  const [finished, setFinished] = useState(false);

  // timing & guards
  const deadlineRef = useRef<number | null>(null);
  const wroteLastUsedRef = useRef(false);
  const resumeFromPauseRef = useRef(false); // <-- key: seed from remaining only after pause->start
  const shouldNotifyRef = useRef(false);

  // audio (single context for iOS)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const primeAudio = async () => {
    try {
      if (!audioCtxRef.current) {
        const Ctx = (window.AudioContext ||
          (window as any).webkitAudioContext) as typeof AudioContext;
        audioCtxRef.current = new Ctx();
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
    } catch {}
  };
  const buzz = (pattern: number | number[] = 60) => {
    try {
      navigator.vibrate?.(pattern);
    } catch {}
  };
  const beep = (ms = 120, freq = 1000) => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.06;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        try {
          osc.stop();
        } catch {}
      }, ms);
    } catch {}
  };

  const total = useMemo(
    () => steps.reduce((a, s) => a + (Number(s.duration) || 0), 0),
    [steps]
  );

  const elapsedOverall = useMemo(() => {
    if (!steps.length || !steps[idx]) return 0;
    const prior = steps
      .slice(0, idx)
      .reduce((a, s) => a + (s.duration || 0), 0);
    const curDur = steps[idx].duration || 0;
    // key: count elapsed even when paused
    const curElapsed = Math.max(0, curDur - Math.max(0, remaining));
    return prior + curElapsed;
  }, [steps, idx, remaining]);

  const totalRemaining = useMemo(
    () => Math.max(0, total - Math.floor(elapsedOverall)),
    [total, elapsedOverall]
  );
  const getProgress = () =>
    finished ? 100 : total ? (elapsedOverall / total) * 100 : 0;

  // actions
  const start = async () => {
    if (!steps.length) return;
    await primeAudio();
    shouldNotifyRef.current = true;
    resumeFromPauseRef.current = true;
    buzz(40);
    beep(110, 950);
    setFinished(false);
    setRunning(true);
  };

  const pause = () => {
    setRunning(false);
    deadlineRef.current = null; // keep remaining; reseed on next start from remaining
  };

  const resetStep = () => {
    setRunning(false);
    setFinished(false);
    setRemaining(steps[idx]?.duration ?? 0);
    deadlineRef.current = null;
    resumeFromPauseRef.current = false;
  };

  const prev = async () => {
    if (idx === 0) return;
    await primeAudio();
    shouldNotifyRef.current = true;
    setFinished(false);
    setIdx((i) => i - 1);
    deadlineRef.current = null; // entering new step -> seed from full duration
    resumeFromPauseRef.current = false;
  };

  const next = async () => {
    if (idx >= steps.length - 1) return;
    await primeAudio();
    shouldNotifyRef.current = true;
    setFinished(false);
    setIdx((i) => i + 1);
    deadlineRef.current = null; // entering new step -> seed from full duration
    resumeFromPauseRef.current = false;
  };

  const current = steps[idx];
  const nextStep = steps[idx + 1];

  // init on recipe change
  useEffect(() => {
    setIdx(0);
    setRunning(false);
    setFinished(false);
    setRemaining(steps[0]?.duration ?? 0);
    deadlineRef.current = null;
    wroteLastUsedRef.current = false;
    shouldNotifyRef.current = false;
    resumeFromPauseRef.current = false;
  }, [recipe?.id]);

  // step entry: only set remaining immediately when NOT running (for display);
  // if running, let the ticking effect seed remaining synchronously with deadline.
  useEffect(() => {
    setFinished(false);
    deadlineRef.current = null;
    if (!running) {
      setRemaining(steps[idx]?.duration ?? 0);
    }
    if (shouldNotifyRef.current) {
      buzz(60);
      beep(120, 1000);
    }
  }, [idx]);

  // ticking loop (drift-proof)
  useEffect(() => {
    if (!running) return;

    if (!wroteLastUsedRef.current && recipe) {
      updateRecipe(recipe.id!, { lastUsedAt: new Date().toISOString() });
      wroteLastUsedRef.current = true;
    }

    if (deadlineRef.current == null) {
      const dur = steps[idx]?.duration ?? 0;
      const startFrom = resumeFromPauseRef.current
        ? Math.max(0, remaining)
        : dur;
      // seed both deadline and remaining together to avoid races
      deadlineRef.current = Date.now() + startFrom * 1000;
      setRemaining(startFrom);
      resumeFromPauseRef.current = false;
    }

    const interval = setInterval(() => {
      const leftMs = Math.max(0, (deadlineRef.current as number) - Date.now());
      const secLeft = Math.ceil(leftMs / 1000);
      setRemaining(secLeft);

      if (secLeft <= 0) {
        if (idx < steps.length - 1) {
          setIdx((i) => i + 1); // auto-advance
          deadlineRef.current = null; // new step seeds next tick from full duration
          // notifications fire in [idx] effect
        } else {
          setRunning(false);
          setFinished(true);
          deadlineRef.current = null;
          buzz([80, 40, 80]);
          beep(180, 1200);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [running, idx, steps.length, recipe?.id]);

  if (!recipe) {
    return (
      <Container size="xs">
        <Stack gap="md" mt="md">
          <Group gap="xs" align="center">
            <ActionIcon
              variant="subtle"
              component={Link}
              to="/"
              aria-label="Back"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Title order={4}>Recipe not found</Title>
          </Group>
          <Button component={Link} to="/" variant="outline" color="yellow">
            Go home
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xs">
      <Stack gap="md" mt="xs">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <ActionIcon
              variant="subtle"
              component={Link}
              to="/"
              aria-label="Back"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Stack gap={0}>
              <Title order={4} fw={800}>
                {recipe.title}
              </Title>
              <Group gap="xs">
                <Badge
                  color={recipe.brewerId ? "yellow" : "gray"}
                  variant="light"
                >
                  {recipe.brewer}
                </Badge>
                <Badge variant="light" leftSection={<IconClock size={14} />}>
                  {fmt(total)}
                </Badge>
                <Badge
                  variant="light"
                  color="gray"
                  leftSection={<IconClock size={14} />}
                >
                  {finished ? "00:00 left" : `${fmt(totalRemaining)} left`}
                </Badge>
              </Group>
            </Stack>
          </Group>
        </Group>

        {/* Timer Card */}
        <Card
          withBorder
          radius="lg"
          p="lg"
          styles={{
            root: {
              backgroundColor: theme.colors.dark[7],
              borderColor: theme.colors.dark[5],
            },
          }}
        >
          <Stack gap="sm" align="center">
            <Text c="dimmed" size="sm">
              Step {current?.step ?? "-"} / {steps.length || "-"}
            </Text>

            <Title
              order={1}
              style={{ fontSize: 64, lineHeight: 1, letterSpacing: 1 }}
            >
              {fmt(Math.max(0, remaining))}
            </Title>

            <Text ta="center" fw={700} style={{ minHeight: 40 }}>
              {current?.text || "—"}
            </Text>

            <Group justify="center" gap="xs">
              <ActionIcon
                size="lg"
                radius="xl"
                variant="subtle"
                onClick={prev}
                disabled={idx === 0}
                aria-label="Previous step"
              >
                <IconChevronLeft size={18} />
              </ActionIcon>

              {running ? (
                <Button
                  size="md"
                  variant="light"
                  leftSection={<IconPlayerPause size={18} />}
                  onClick={pause}
                >
                  Pause
                </Button>
              ) : (
                <Button
                  size="md"
                  color="yellow"
                  leftSection={<IconPlayerPlay size={18} />}
                  disabled={finished}
                  onClick={start}
                >
                  Start
                </Button>
              )}

              <ActionIcon
                size="lg"
                radius="xl"
                variant="subtle"
                onClick={next}
                disabled={idx >= steps.length - 1}
                aria-label="Next step"
              >
                <IconChevronRight size={18} />
              </ActionIcon>

              <ActionIcon
                size="lg"
                radius="xl"
                variant="subtle"
                onClick={resetStep}
                aria-label="Reset current step"
              >
                <IconSquare size={16} />
              </ActionIcon>
            </Group>

            <Progress
              value={getProgress()}
              color="yellow"
              radius="lg"
              w="100%"
            />
            <Group justify="center" gap="xs">
              <Text c="dimmed" size="sm">
                {finished
                  ? `${fmt(total)} / ${fmt(total)} total`
                  : `${fmt(Math.floor(elapsedOverall))} / ${fmt(total)} total`}
              </Text>
            </Group>

            {nextStep && (
              <Group gap="xs" justify="center">
                <IconChevronDown size={16} />
                <Text c="dimmed" size="sm">
                  Next: <b>{nextStep.text || "—"}</b> ·{" "}
                  {fmt(nextStep.duration || 0)}
                </Text>
              </Group>
            )}
          </Stack>
        </Card>

        {finished && (
          <>
            <Badge color="yellow" variant="filled" size="lg">
              Finished!
            </Badge>
            <Button
              variant="light"
              onClick={() => {
                setIdx(0);
                setRemaining(steps[0]?.duration ?? 0);
                setFinished(false);
                deadlineRef.current = null;
                setRunning(false);
                wroteLastUsedRef.current = false;
                shouldNotifyRef.current = false;
                resumeFromPauseRef.current = false;
              }}
            >
              Restart
            </Button>
          </>
        )}

        {/* Step list (tap to jump) */}
        <Stack gap="sm">
          {steps.map((s, i) => (
            <Card
              key={i}
              withBorder
              radius="lg"
              p="md"
              onClick={async () => {
                await primeAudio();
                shouldNotifyRef.current = true;
                setFinished(false);
                setIdx(i);
                deadlineRef.current = null; // new step -> full duration
                resumeFromPauseRef.current = false; // not a pause resume
              }}
              style={{ cursor: "pointer" }}
              styles={{
                root: {
                  backgroundColor:
                    i === idx ? theme.colors.dark[6] : theme.colors.dark[7],
                  borderColor:
                    i === idx ? theme.colors.yellow[6] : theme.colors.dark[5],
                },
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Badge color="yellow" variant="light">
                    Step {s.step}
                  </Badge>
                  <Text fw={600}>
                    {s.text || (
                      <em style={{ color: theme.colors.gray[5] }}>
                        No instruction
                      </em>
                    )}
                  </Text>
                </Stack>
                <Text fw={700}>{fmt(Number(s.duration) || 0)}</Text>
              </Group>
            </Card>
          ))}

          {steps.length === 0 && (
            <Center>
              <Text c="dimmed">No steps in this recipe.</Text>
            </Center>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
