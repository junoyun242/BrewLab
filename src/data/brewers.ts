import React from "react";
import {
  IconFilter,
  IconCup,
  IconDroplet,
  IconCoffee,
  type IconProps,
} from "@tabler/icons-react";
import type { BrewerId } from "../types/recipe";

export type BrewerDef = {
  id: BrewerId;
  label: string;
  icon: React.ComponentType<IconProps>;
  aliases?: string[];
};

export const BREWERS: BrewerDef[] = [
  {
    id: "v60",
    label: "V60",
    icon: IconFilter,
    aliases: ["hario", "v-60", "cone"],
  },
  {
    id: "aeropress",
    label: "AeroPress",
    icon: IconCup,
    aliases: ["aero", "press"],
  },
  {
    id: "kalita",
    label: "Kalita Wave",
    icon: IconFilter,
    aliases: ["wave", "flat"],
  },
  { id: "chemex", label: "Chemex", icon: IconDroplet },
  { id: "frenchpress", label: "French Press", icon: IconCoffee },
  { id: "espresso", label: "Espresso", icon: IconCoffee },
  { id: "moka", label: "Moka Pot", icon: IconCoffee },
  { id: "siphon", label: "Siphon", icon: IconDroplet },
];

export const BREWER_MAP = Object.fromEntries(BREWERS.map((b) => [b.id, b]));
