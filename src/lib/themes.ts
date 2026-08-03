export interface Theme {
  id: string;
  name: string;
  colors: {
    bg: string;
    bgEnd: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
    accentSoft: string;
  };
}

// Colors stored as "r g b" triples so they slot into Tailwind's
// rgb(var(--token) / <alpha-value>) pattern.
export const themes: Theme[] = [
  {
    id: "violet-noir",
    name: "Violet Noir",
    colors: {
      bg: "11 7 16",
      bgEnd: "23 15 36",
      surface: "20 13 31",
      border: "47 36 63",
      text: "236 231 239",
      muted: "158 148 168",
      accent: "138 111 199",
      accentSoft: "74 52 102",
    },
  },
  {
    id: "obsidian-blue",
    name: "Obsidian Blue",
    colors: {
      bg: "6 10 16",
      bgEnd: "13 20 32",
      surface: "11 17 27",
      border: "34 47 63",
      text: "227 234 240",
      muted: "137 152 168",
      accent: "88 130 168",
      accentSoft: "39 61 82",
    },
  },
  {
    id: "emerald-depths",
    name: "Emerald Depths",
    colors: {
      bg: "6 14 11",
      bgEnd: "13 26 21",
      surface: "10 20 16",
      border: "31 54 45",
      text: "227 240 233",
      muted: "140 165 152",
      accent: "79 155 124",
      accentSoft: "35 72 58",
    },
  },
  {
    id: "ember-clay",
    name: "Ember Clay",
    colors: {
      bg: "16 9 8",
      bgEnd: "29 17 15",
      surface: "22 13 12",
      border: "58 37 32",
      text: "240 230 226",
      muted: "173 148 138",
      accent: "181 84 58",
      accentSoft: "84 42 32",
    },
  },
  {
    id: "amber-dusk",
    name: "Amber Dusk",
    colors: {
      bg: "14 11 5",
      bgEnd: "27 21 10",
      surface: "20 16 8",
      border: "56 45 24",
      text: "240 233 219",
      muted: "173 157 128",
      accent: "201 154 62",
      accentSoft: "82 63 27",
    },
  },
  {
    id: "slate-mono",
    name: "Slate Mono",
    colors: {
      bg: "9 9 10",
      bgEnd: "18 18 20",
      surface: "14 14 16",
      border: "44 44 48",
      text: "232 232 234",
      muted: "150 150 155",
      accent: "210 210 216",
      accentSoft: "60 60 66",
    },
  },
];

export const defaultThemeId = "violet-noir";

export function getTheme(id: string | undefined | null): Theme {
  return themes.find((t) => t.id === id) ?? themes.find((t) => t.id === defaultThemeId)!;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement.style;
  root.setProperty("--c-bg", theme.colors.bg);
  root.setProperty("--c-bg-end", theme.colors.bgEnd);
  root.setProperty("--c-surface", theme.colors.surface);
  root.setProperty("--c-border", theme.colors.border);
  root.setProperty("--c-text", theme.colors.text);
  root.setProperty("--c-muted", theme.colors.muted);
  root.setProperty("--c-accent", theme.colors.accent);
  root.setProperty("--c-accent-soft", theme.colors.accentSoft);
}
