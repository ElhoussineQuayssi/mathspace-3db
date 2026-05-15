export type ShapeKind = "cylinder" | "cone" | "rectangle" | "triangular-pyramid";

export type ShapeDefinition = {
  name: string;
  shortName: string;
  description: string;
  kind: ShapeKind;
  accent: string;
  progress: number;
  quizScore: number;
};

export const shapeDefinitions: ShapeDefinition[] = [
  {
    name: "Cylindre",
    shortName: "Cylindre",
    description: "Observez le rayon, la hauteur, le volume et la surface circulaire.",
    kind: "cylinder",
    accent: "from-cyan-300 to-blue-500",
    progress: 72,
    quizScore: 84,
  },
  {
    name: "Cone",
    shortName: "Cone",
    description: "Manipulez le rayon, la hauteur et la generatrice du cone.",
    kind: "cone",
    accent: "from-amber-300 to-rose-500",
    progress: 58,
    quizScore: 76,
  },
  {
    name: "Rectangle",
    shortName: "Rectangle",
    description: "Explorez un prisme rectangle avec longueur, profondeur et hauteur.",
    kind: "rectangle",
    accent: "from-violet-300 to-fuchsia-500",
    progress: 86,
    quizScore: 92,
  },
  {
    name: "Pyramide triangulaire",
    shortName: "Pyramide",
    description: "Etudiez une base triangulaire, une hauteur et les faces laterales.",
    kind: "triangular-pyramid",
    accent: "from-emerald-300 to-teal-500",
    progress: 46,
    quizScore: 68,
  },
];

export const shapeTags: Record<ShapeKind, string[]> = {
  cylinder: ["Volume live", "Patron"],
  cone: ["Volume live", "Patron"],
  rectangle: ["Volume live", "Patron 3D"],
  "triangular-pyramid": ["Volume live", "Patron"],
};

export function getShapeDefinition(kind: string | null | undefined) {
  return shapeDefinitions.find((shape) => shape.kind === kind) ?? shapeDefinitions[0];
}
