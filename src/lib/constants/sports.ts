import type { SportSlug } from "@/types";

export const SPORT_ICONS: Record<
  SportSlug,
  { label: string; image: string }
> = {
  futsal: {
    label: "Futsal",
    image: "/icons/futsal-ball.svg",
  },
  futebol: {
    label: "Futebol",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Soccerball.svg/120px-Soccerball.svg.png",
  },
  basquete: {
    label: "Basquete",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Basketball.png/120px-Basketball.png",
  },
};
