export type QuizCategory = "shapes" | "surfaces" | "volumes";

export interface QuizAnswer {
  id: string;
  label: string;
  isCorrect: boolean;
}

export type QuizQuestionType = "mcq";

// Reused by spatial diagnostics to indicate cube faces.
// Note: Spatial quiz functionality has been removed.

export interface QuizQuestionBase {

  id: string;
  category: QuizCategory;
  question: string;
  answers: QuizAnswer[];
  feedback: {
    correct: string;
    incorrect: string;
  };
  difficulty: "easy" | "medium" | "hard";
  type?: QuizQuestionType;
}

export interface QuizMcqQuestion extends QuizQuestionBase {
   type?: "mcq";
 }

export type QuizQuestion = QuizMcqQuestion;

export const quizQuestions: QuizQuestion[] = [
  // ==================== SHAPES (FORMES) ====================
  {
    type: "mcq",
    id: "shape-1",
    category: "shapes",
    question: "Combien de faces possède un cube ?",
    answers: [
      { id: "a", label: "4 faces", isCorrect: false },
      { id: "b", label: "6 faces", isCorrect: true },
      { id: "c", label: "8 faces", isCorrect: false },
      { id: "d", label: "12 faces", isCorrect: false },
    ],
    feedback: {
      correct: "Exact ! Un cube a 6 faces carrées identiques.",
      incorrect: "Presque. Vérifiez en comptant les faces opposées du cube.",
    },
    difficulty: "easy",
  },
  {
    type: "mcq",
    id: "shape-2",
    category: "shapes",
    question: "Combien d'arêtes possède un cube ?",
    answers: [
      { id: "a", label: "8 arêtes", isCorrect: false },
      { id: "b", label: "10 arêtes", isCorrect: false },
      { id: "c", label: "12 arêtes", isCorrect: true },
      { id: "d", label: "14 arêtes", isCorrect: false },
    ],
    feedback: {
      correct: "Correct ! Un cube possède 12 arêtes de même longueur.",
      incorrect: "Non. Comptez les arêtes du haut, du bas et les arêtes verticales.",
    },
    difficulty: "easy",
  },
  {
    type: "mcq",
    id: "shape-3",
    category: "shapes",
    question: "Combien de sommets possède un cube ?",
    answers: [
      { id: "a", label: "4 sommets", isCorrect: false },
      { id: "b", label: "6 sommets", isCorrect: false },
      { id: "c", label: "8 sommets", isCorrect: true },
      { id: "d", label: "12 sommets", isCorrect: false },
    ],
    feedback: {
      correct: "Bravo ! Un cube a 8 sommets (coins).",
      incorrect: "Pensez aux coins du haut et du bas du cube.",
    },
    difficulty: "easy",
  },
  {
    type: "mcq",
    id: "shape-4",
    category: "shapes",
    question: "Qu'est-ce qu'une pyramide à base triangulaire ?",
    answers: [
      { id: "a", label: "Une pyramide avec 4 faces triangulaires", isCorrect: true },
      { id: "b", label: "Une pyramide avec 3 faces triangulaires", isCorrect: false },
      { id: "c", label: "Une pyramide avec 5 faces triangulaires", isCorrect: false },
      { id: "d", label: "Une pyramide avec 6 faces triangulaires", isCorrect: false },
    ],
    feedback: {
      correct: "Exact ! 1 base triangulaire + 3 faces latérales = 4 faces triangulaires.",
      incorrect: "Réfléchissez : la base est triangulaire, plus combien de faces latérales ?",
    },
    difficulty: "medium",
  },
  {
    type: "mcq",
    id: "shape-5",
    category: "shapes",
    question: "Combien de faces latérales possède une pyramide à base carrée ?",
    answers: [
      { id: "a", label: "3 faces latérales", isCorrect: false },
      { id: "b", label: "4 faces latérales", isCorrect: true },
      { id: "c", label: "5 faces latérales", isCorrect: false },
      { id: "d", label: "6 faces latérales", isCorrect: false },
    ],
    feedback: {
      correct: "Correct ! La base carrée a 4 côtés, donc 4 faces latérales.",
      incorrect: "N'oubliez pas : chaque côté de la base carrée correspond à une face latérale.",
    },
    difficulty: "medium",
  },
  {
    type: "mcq",
    id: "shape-6",
    category: "shapes",
    question: "Qu'est-ce qu'un cylindre ?",
    answers: [
      { id: "a", label: "Un solide avec 2 bases carrées et 1 surface latérale", isCorrect: false },
      { id: "b", label: "Un solide avec 2 bases triangulaires et 1 surface latérale", isCorrect: false },
      { id: "c", label: "Un solide avec 2 bases circulaires et 1 surface latérale courbe", isCorrect: true },
      { id: "d", label: "Un solide avec 1 base circulaire et 1 sommet", isCorrect: false },
    ],
    feedback: {
      correct: "Excellent ! Un cylindre a 2 bases circulaires identiques et 1 surface latérale courbe.",
      incorrect: "Revoyez : un cylindre doit avoir 2 bases circulaires.",
    },
    difficulty: "medium",
  },
  {
    type: "mcq",
    id: "shape-7",
    category: "shapes",
    question: "Quel solide a 1 base circulaire et 1 sommet ?",
    answers: [
      { id: "a", label: "Un cube", isCorrect: false },
      { id: "b", label: "Un cône", isCorrect: true },
      { id: "c", label: "Un cylindre", isCorrect: false },
      { id: "d", label: "Une pyramide carrée", isCorrect: false },
    ],
    feedback: {
      correct: "Exact ! Un cône a une base circulaire et se termine par un sommet.",
      incorrect: "Pensez à la forme d'un cornet de glace ou d'un chapeau de fête.",
    },
    difficulty: "easy",
  },
  {
    type: "mcq",
    id: "shape-8",
    category: "shapes",
    question: "Combien de sommets et d'arêtes possède une pyramide à base pentagonale ?",
    answers: [
      { id: "a", label: "5 sommets et 5 arêtes", isCorrect: false },
      { id: "b", label: "6 sommets et 10 arêtes", isCorrect: true },
      { id: "c", label: "7 sommets et 12 arêtes", isCorrect: false },
      { id: "d", label: "8 sommets et 15 arêtes", isCorrect: false },
    ],
    feedback: {
      correct: "Bravo ! 5 sommets de base + 1 sommet = 6 sommets. 5 arêtes de base + 5 latérales = 10 arêtes.",
      incorrect: "Comptez : 5 sommets de la base + le sommet principal, puis les arêtes de base et latérales.",
    },
    difficulty: "hard",
  },

  // ==================== SURFACES (SURFACES) ====================
  {
    type: "mcq",
    id: "surface-1",
    category: "surfaces",
    question: "Quelle est la formule pour la surface d'un carré de côté c ?",
    answers: [
      { id: "a", label: "c", isCorrect: false },
      { id: "b", label: "c²", isCorrect: true },
      { id: "c", label: "2c", isCorrect: false },
      { id: "d", label: "4c", isCorrect: false },
    ],
    feedback: {
      correct: "Exact ! La surface d'un carré est c × c = c².",
      incorrect: "Rappelez-vous : largeur × hauteur d'un carré.",
    },
    difficulty: "easy",
  },
  {
    type: "mcq",
    id: "surface-2",
    category: "surfaces",
    question: "Quelle est la surface totale d'un cube de côté 2 cm ?",
    answers: [
      { id: "a", label: "8 cm²", isCorrect: false },
      { id: "b", label: "16 cm²", isCorrect: false },
      { id: "c", label: "24 cm²", isCorrect: true },
      { id: "d", label: "32 cm²", isCorrect: false },
    ],
    feedback: {
      correct: "Correct ! 6 faces × 2² = 6 × 4 = 24 cm².",
      incorrect: "N'oubliez pas : 6 faces carrées de côté 2 cm.",
    },
    difficulty: "easy",
  },
  {
    type: "mcq",
    id: "surface-3",
    category: "surfaces",
    question: "Quelle est la formule pour la surface d'un rectangle de dimensions l et L ?",
    answers: [
      { id: "a", label: "l + L", isCorrect: false },
      { id: "b", label: "l × L", isCorrect: true },
      { id: "c", label: "2(l + L)", isCorrect: false },
      { id: "d", label: "(l + L)²", isCorrect: false },
    ],
    feedback: {
      correct: "Exact ! La surface d'un rectangle est longueur × largeur.",
      incorrect: "Pensez à multiplier les deux dimensions.",
    },
    difficulty: "easy",
  },
  {
    type: "mcq",
    id: "surface-4",
    category: "surfaces",
    question: "Quelle est la formule pour la surface d'un cercle de rayon r ?",
    answers: [
      { id: "a", label: "2πr", isCorrect: false },
      { id: "b", label: "πr²", isCorrect: true },
      { id: "c", label: "πr", isCorrect: false },
      { id: "d", label: "πr³", isCorrect: false },
    ],
    feedback: {
      correct: "Bravo ! La surface d'un cercle est π × rayon².",
incorrect: "Souvenez-vous : c'est π fois le rayon au carré.",
    },
    difficulty: "medium",
  }]

  // Note: Spatial quiz questions hav];

export const categories: Array<{
  id: QuizCategory;
  name: string;
  description: string;
  color: string;
  icon: string;
}> = [
  {
    id: "shapes",
    name: "Formes",
    description: "Propriétés des solides 3D",
    color: "from-cyan-300 to-blue-500",
    icon: "🔷",
  },
  {
    id: "surfaces",
    name: "Surfaces",
    description: "Calculs d'aires et de surfaces",
    color: "from-violet-300 to-fuchsia-500",
    icon: "⬜",
  },
  {
    id: "volumes",
    name: "Volumes",
    description: "Calculs de volumes et de capacités",
    color: "from-emerald-300 to-teal-500",
    icon: "📦",
  },
];

export function getQuestionsByCategory(category: QuizCategory): QuizQuestion[] {
  return quizQuestions.filter((q) => q.category === category);
}

export function getCategoryInfo(category: QuizCategory) {
  return categories.find((c) => c.id === category);
}

