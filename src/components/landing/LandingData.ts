export interface HeroHighlight {
  id: "java" | "spring" | "ai";
  title: string;
  subtitle: string;
}

export const HERO_HIGHLIGHTS: HeroHighlight[] = [
  {
    id: "java",
    title: "Java & POO",
    subtitle: "45h de trilha",
  },
  {
    id: "spring",
    title: "Spring & GoF",
    subtitle: "2 microsserviços",
  },
  {
    id: "ai",
    title: "IA & Voz",
    subtitle: "OpenAI & Whisper",
  },
];
