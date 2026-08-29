export interface MathProblem {
  target: number;
  correct: string[];
  wrong: string[];
}

export const TIER_PROBLEMS: Record<number, MathProblem[]> = {
  1: [
    { target: 15, correct: ["10+5", "20-5", "8+7", "30-15"], wrong: ["10+10", "20-10", "5+5", "15+5"] },
    { target: 32, correct: ["20+12", "40-8", "16+16", "50-18"], wrong: ["20+20", "30-2", "16+10", "40-18"] }
  ],
  2: [
    { target: 24, correct: ["8x3", "12x2", "6x4", "48÷2", "72÷3"], wrong: ["8x4", "12x3", "6x5", "48÷4", "72÷2"] },
    { target: 60, correct: ["12x5", "15x4", "20x3", "120÷2"], wrong: ["12x6", "15x3", "20x4", "120÷3"] }
  ],
  3: [
    { target: 45, correct: ["(10x4)+5", "50-(25÷5)", "9x(10÷2)"], wrong: ["10x(4+5)", "(50-25)÷5", "9x10÷3"] },
    { target: 100, correct: ["(50x2)", "25x4", "(150-50)", "10²"], wrong: ["50+2", "25+4", "150+50", "2¹⁰"] }
  ]
};

export const BOSS_EQUATION = "3X + 5 = 20";
export const BOSS_TARGET_X = 5;
export const MINION_NUMBERS = [3, 5, 10, 15];

export function getKillsRequiredForLevel(level: number): number {
  if (level === 1) return 10;
  if (level === 2) return 15;
  if (level >= 3 && level < 10) return 20;
  return 5; // Boss requires 5 hits
}

export function getTierForLevel(level: number): number {
  if (level >= 1 && level <= 3) return 1;
  if (level >= 4 && level <= 6) return 2;
  if (level >= 7 && level <= 9) return 3;
  return 4; // Boss
}

export function getProblemForLevel(level: number): MathProblem {
  const tier = getTierForLevel(level);
  if (tier === 4) return { target: BOSS_TARGET_X, correct: [], wrong: [] };
  
  const problems = TIER_PROBLEMS[tier];
  // Select problem based on level index
  const index = (level - 1) % problems.length;
  return problems[index];
}

export function generateEquationSet(problem: MathProblem): { correct: string, wrongs: string[] } {
  const correct = problem.correct[Math.floor(Math.random() * problem.correct.length)];
  
  // Pick up to 3 random wrong equations
  const shuffledWrongs = [...problem.wrong].sort(() => 0.5 - Math.random());
  const wrongs = shuffledWrongs.slice(0, 3);
  
  return { correct, wrongs };
}
