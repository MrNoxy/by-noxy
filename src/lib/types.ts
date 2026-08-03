export interface Panel {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  link: string; // internal (/project/xyz) or external URL
  order: number;
  featured: boolean;
  createdAt: number;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  pfpUrl: string | null;
  themeId: string;
  socials: {
    github?: string;
    twitter?: string;
    email?: string;
    linkedin?: string;
  };
}

export const defaultSiteConfig: SiteConfig = {
  name: "Noxy",
  tagline: "Building small, sharp things.",
  pfpUrl: null,
  themeId: "violet-noir",
  socials: {},
};
