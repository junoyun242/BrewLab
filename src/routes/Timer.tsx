/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Flex, Text, useMantineTheme, ActionIcon } from "@mantine/core";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconRotate,
} from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";

const clamp = (n: number, a: number, b: number) => Math.min(Math.max(n, a), b);
const pad = (n: number) => String(n).padStart(2, "0");

/* Knob geometry */
const ANGLE_START = 140; // arc begins (deg)
const ANGLE_SWEEP = 280; // active arc width (deg)
const ANGLE_END = ANGLE_START + ANGLE_SWEEP;

/** Map any angle to 0–360 */
const norm360 = (deg: number) => ((deg % 360) + 360) % 360;

/** Clamp a raw angle into the knob's arc without wrapping. */
const clampAngleToArc = (a: number) => {
  const A = norm360(a);
  if (ANGLE_END <= 360) {
    if (A < ANGLE_START) return ANGLE_START;
    if (A > ANGLE_END) return ANGLE_END;
    return A;
  } else {
    const endMod = ANGLE_END - 360;
    const inArc = A >= ANGLE_START || A <= endMod;
    if (inArc) return A;
    const distToStart = Math.abs(A - ANGLE_START);
    const distToEnd = Math.abs(A - endMod);
    return distToStart < distToEnd ? ANGLE_START : endMod;
  }
};

const valueToAngle = (value: number, min: number, max: number) => {
  const ratio = (value - min) / (max - min || 1);
  return ANGLE_START + ratio * ANGLE_SWEEP;
};

const angleToValueClamped = (deg: number, min: number, max: number) => {
  const a = clampAngleToArc(deg);
  const rel = a >= ANGLE_START ? a - ANGLE_START : 360 - ANGLE_START + a;
  const ratio = clamp(rel / ANGLE_SWEEP, 0, 1);
  return Math.round(min + ratio * (max - min));
};

const useAudio = () => {
  const ctxRef = useRef<AudioContext | null>(null);
  const prime = async () => {
    try {
      if (!ctxRef.current) {
        const Ctx = (window.AudioContext ||
          (window as any).webkitAudioContext) as typeof AudioContext;
        ctxRef.current = new Ctx();
      }
      if (ctxRef.current.state === "suspended") {
        await ctxRef.current.resume();
      }
    } catch {}
  };
  const knobTick = (gainLevel = 0.045) => {
    try {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 740 + Math.random() * 120;
      gain.gain.value = gainLevel;
      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {}
  };
  const tripleFinish = () => {
    try {
      navigator.vibrate?.([120, 60, 120, 60, 120]);
    } catch {}
    const play = (delayMs: number) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 1200;
      const t = ctx.currentTime + delayMs / 1000;
      gain.gain.value = 0.06;
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1);
      osc.stop(t + 0.24);
    };
    play(0);
    play(800);
    play(1600);
  };
  return { prime, knobTick, tripleFinish };
};

type KnobProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onTick: () => void;
  primeAudio: () => Promise<void>;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: number;
};

const Knob = ({
  label,
  value,
  onChange,
  onTick,
  primeAudio,
  min = 0,
  max = 59,
  disabled,
  size = 150,
}: KnobProps) => {
  const theme = useMantineTheme();
  const ref = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const lastTickMsRef = useRef(0);

  const emitTick = async () => {
    const now = performance.now();
    if (now - lastTickMsRef.current < 30) return;
    lastTickMsRef.current = now;
    await primeAudio();
    onTick();
    try {
      navigator.vibrate?.(5);
    } catch {}
  };

  const handleFromEvent = (x: number, y: number) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const deg = norm360((Math.atan2(-dy, dx) * 180) / Math.PI);
    const next = angleToValueClamped(deg, min, max);
    if (next !== value) {
      onChange(next);
      void emitTick();
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    handleFromEvent(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || disabled) return;
    handleFromEvent(e.clientX, e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };
  const onWheel: React.WheelEventHandler = (e) => {
    if (disabled) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? -1 : 1;
    const next = clamp(value + dir, min, max);
    if (next !== value) {
      onChange(next);
      void emitTick();
    }
  };

  const angle = valueToAngle(value, min, max);
  const rPx = size / 2;
  const strokeW = 10;

  const startRad = (ANGLE_START * Math.PI) / 180;
  const endRad = (ANGLE_END * Math.PI) / 180;
  const arcR = rPx - strokeW;
  const sx = rPx + arcR * Math.cos(startRad);
  const sy = rPx - arcR * Math.sin(startRad);
  const ex = rPx + arcR * Math.cos(endRad);
  const ey = rPx - arcR * Math.sin(endRad);
  const largeArc = ANGLE_SWEEP > 180 ? 1 : 0;
  const sweepFlag = 0;

  const needleRad = (angle * Math.PI) / 180;
  const nx = rPx + (arcR - 6) * Math.cos(needleRad);
  const ny = rPx - (arcR - 6) * Math.sin(needleRad);

  return (
    <Box
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      style={{
        width: size,
        userSelect: "none",
        touchAction: "none",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text
        ta="center"
        c="dimmed"
        size="sm"
        mb={8}
        style={{ userSelect: "none" }}
      >
        {label}
      </Text>

      <svg width={size} height={size} style={{ display: "block" }}>
        <circle
          cx={rPx}
          cy={rPx}
          r={rPx - 2}
          fill={theme.colors.dark[6]}
          stroke={theme.colors.dark[5]}
          strokeWidth={2}
        />
        <path
          d={`M ${sx} ${sy} A ${arcR} ${arcR} 0 ${largeArc} ${sweepFlag} ${ex} ${ey}`}
          stroke={theme.colors.dark[4]}
          strokeWidth={strokeW}
          fill="none"
          strokeLinecap="round"
          pathLength={ANGLE_SWEEP}
        />
        <path
          d={`M ${sx} ${sy} A ${arcR} ${arcR} 0 ${largeArc} ${sweepFlag} ${ex} ${ey}`}
          stroke={theme.colors.yellow[6]}
          strokeWidth={strokeW}
          fill="none"
          strokeLinecap="round"
          pathLength={ANGLE_SWEEP}
          style={{
            strokeDasharray: `${
              ((value - min) / (max - min || 1)) * ANGLE_SWEEP
            } ${ANGLE_SWEEP}`,
          }}
        />
        <line
          x1={rPx}
          y1={rPx}
          x2={nx}
          y2={ny}
          stroke="#fff"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={rPx} cy={rPx} r={6} fill={theme.colors.dark[3]} />
      </svg>

      <Text
        ta="center"
        size="xl"
        fw={800}
        mt={6}
        style={{ userSelect: "none" }}
      >
        {pad(value)}
      </Text>
      <Text
        ta="center"
        size="xs"
        c="dimmed"
        mb={6}
        style={{ userSelect: "none" }}
      ></Text>
    </Box>
  );
};

const KnobTimer = () => {
  const theme = useMantineTheme();
  const { prime, knobTick, tripleFinish } = useAudio();

  const [minute, setMinute] = useState(0);
  const [seconds, setSeconds] = useState(30);

  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [finished, setFinished] = useState(false);

  const deadlineRef = useRef<number | null>(null);
  const resumeFromPauseRef = useRef(false);

  const totalInputSeconds = useMemo(
    () => clamp((minute || 0) * 60 + (seconds || 0), 0, 59 * 60 + 59),
    [minute, seconds]
  );

  const displaySeconds = finished ? 0 : started ? remaining : totalInputSeconds;
  const displayMin = Math.floor(displaySeconds / 60);
  const displaySec = displaySeconds % 60;

  const knobMinValue = started ? displayMin : minute;
  const knobSecValue = started ? displaySec : seconds;
  const knobsDisabled = started;

  const start = async () => {
    if (running) return;
    if (!started && totalInputSeconds <= 0) return;
    await prime();
    setFinished(false);
    if (!started) {
      setRemaining(totalInputSeconds);
      resumeFromPauseRef.current = false;
      setStarted(true);
    } else {
      resumeFromPauseRef.current = true;
    }
    setRunning(true);
  };

  const pause = () => {
    setRunning(false);
    deadlineRef.current = null;
  };

  const toggle = () => (running ? pause() : start());

  const reset = () => {
    setRunning(false);
    setStarted(false);
    setRemaining(0);
    setFinished(false);
    deadlineRef.current = null;
    resumeFromPauseRef.current = false;
  };

  useEffect(() => {
    if (!running) return;

    if (deadlineRef.current == null) {
      const seed = resumeFromPauseRef.current
        ? Math.max(remaining, 0)
        : remaining > 0
        ? remaining
        : totalInputSeconds;
      deadlineRef.current = Date.now() + seed * 1000;
      setRemaining(seed);
      resumeFromPauseRef.current = false;
    }

    const id = setInterval(() => {
      const leftMs = Math.max(0, (deadlineRef.current as number) - Date.now());
      const secLeft = Math.ceil(leftMs / 1000);
      setRemaining(secLeft);

      if (secLeft <= 0) {
        setRunning(false);
        setFinished(true);
        deadlineRef.current = null;
        void prime().then(tripleFinish);
      }
    }, 200);

    return () => clearInterval(id);
  }, [running, remaining]);

  return (
    <Flex
      align="center"
      justify="center"
      direction="column"
      gap={24}
      mih="calc(100svh - 64px)"
      style={{ userSelect: "none", "-webkit-user-select": "none" }}
    >
      <Box
        style={{
          padding: "10px 16px",
          borderRadius: 16,
          background: theme.colors.dark[6],
          minWidth: 220,
          textAlign: "center",
          border: `1px solid ${theme.colors.dark[5]}`,
        }}
      >
        <Text
          size="72px"
          fw={900}
          c="white"
          style={{ lineHeight: 1, userSelect: "none" }}
        >
          {pad(displayMin)}:{pad(displaySec)}
        </Text>
      </Box>

      <Flex gap={28} align="center" justify="center">
        <Knob
          label="MIN"
          value={knobMinValue}
          onChange={(v) => !knobsDisabled && setMinute(clamp(v, 0, 59))}
          onTick={() => knobTick(0.05)}
          primeAudio={prime}
          min={0}
          max={59}
          disabled={knobsDisabled}
          size={150}
        />
        <Knob
          label="SEC"
          value={knobSecValue}
          onChange={(v) => !knobsDisabled && setSeconds(clamp(v, 0, 59))}
          onTick={() => knobTick(0.05)}
          primeAudio={prime}
          min={0}
          max={59}
          disabled={knobsDisabled}
          size={150}
        />
      </Flex>

      <Flex justify="center" gap={16} mt={8}>
        <ActionIcon
          size="xl"
          radius="xl"
          variant="filled"
          color={running ? "gray" : "yellow"}
          onClick={toggle}
          aria-label={running ? "Pause" : "Start"}
          styles={{
            root: {
              width: 64,
              height: 64,
              boxShadow:
                "0 2px 10px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.05)",
            },
          }}
        >
          {running ? (
            <IconPlayerPause size={28} />
          ) : (
            <IconPlayerPlay size={28} />
          )}
        </ActionIcon>

        <ActionIcon
          size="xl"
          radius="xl"
          variant="outline"
          color="gray"
          onClick={reset}
          aria-label="Reset"
          styles={{
            root: {
              width: 64,
              height: 64,
              borderColor: theme.colors.dark[4],
              background: theme.colors.dark[7],
            },
          }}
        >
          <IconRotate size={26} />
        </ActionIcon>
      </Flex>
    </Flex>
  );
};

export default KnobTimer;
