export type BrewerId =
  | "v60"
  | "aeropress"
  | "kalita"
  | "chemex"
  | "frenchpress"
  | "espresso"
  | "moka"
  | "siphon";

export interface IStep {
  step: number;
  text: string;
  duration: number; // seconds
}

export interface IRecipe {
  id?: string;
  title: string;
  brewer: string; // user-visible label (can be custom)
  brewerId?: BrewerId; // preset id if chosen
  steps: IStep[];
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
}
