type ProfileStrengthInputs = {
  averageSkillScore: number;
  solvedQuestions: number;
  totalQuestions: number;
  streakDays: number;
  completedMockInterviews: number;
  activeDaysLast30: number;
  contributionScoreLast30: number;
};

export type ProfileStrengthBreakdown = {
  mastery: number;
  coverage: number;
  consistency: number;
  interviewReadiness: number;
  engagement: number;
};

export type ProfileStrengthResult = {
  score: number;
  percentileText: string;
  breakdown: ProfileStrengthBreakdown;
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const toPercentileText = (score: number): string => {
  if (score >= 90) return 'Top 2% of Candidates';
  if (score >= 80) return 'Top 5% of Candidates';
  if (score >= 70) return 'Top 10% of Candidates';
  if (score >= 60) return 'Top 20% of Candidates';
  if (score >= 50) return 'Top 35% of Candidates';
  return 'Top 50% of Candidates';
};

export const calculateProfileStrength = (inputs: ProfileStrengthInputs): ProfileStrengthResult => {
  const mastery = clamp(inputs.averageSkillScore);

  const coverageRatio = inputs.totalQuestions > 0
    ? inputs.solvedQuestions / inputs.totalQuestions
    : 0;
  const coverage = clamp(coverageRatio * 100);

  const streakScore = clamp((inputs.streakDays / 30) * 100);
  const activeDaysScore = clamp((inputs.activeDaysLast30 / 20) * 100);
  const consistency = clamp((streakScore * 0.6) + (activeDaysScore * 0.4));

  const interviewReadiness = clamp((inputs.completedMockInterviews / 10) * 100);

  const engagement = clamp((inputs.contributionScoreLast30 / 300) * 100);

  const weightedScore = (
    mastery * 0.35 +
    coverage * 0.25 +
    consistency * 0.15 +
    interviewReadiness * 0.15 +
    engagement * 0.10
  );

  const score = Math.round(clamp(weightedScore));

  return {
    score,
    percentileText: toPercentileText(score),
    breakdown: {
      mastery: Math.round(mastery),
      coverage: Math.round(coverage),
      consistency: Math.round(consistency),
      interviewReadiness: Math.round(interviewReadiness),
      engagement: Math.round(engagement),
    },
  };
};
