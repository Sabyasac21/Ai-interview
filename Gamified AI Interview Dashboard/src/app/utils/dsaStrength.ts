import { DSA_SUBTOPICS, DsaSubtopicKey } from '../data/dsaSubtopics';

export type DsaQuestionLite = {
  id: string;
  title: string;
  tags?: string[];
};

export type DsaStrengthItem = {
  key: DsaSubtopicKey;
  label: string;
  total: number;
  solved: number;
  scoreAvg: number;
  strength: number;
};

const normalize = (value: string) => value.toLowerCase();

const matchSubtopic = (question: DsaQuestionLite): DsaSubtopicKey => {
  const haystack = [
    question.title || '',
    ...(question.tags || []),
  ]
    .map((v) => normalize(String(v)))
    .join(' ');

  for (const topic of DSA_SUBTOPICS) {
    if (topic.key === 'other') continue;
    if (topic.keywords.some((kw) => haystack.includes(normalize(kw)))) {
      return topic.key;
    }
  }
  return 'other';
};

export const computeDsaStrength = (
  questions: DsaQuestionLite[],
  solvedIds: Set<string>,
  scoreByQuestion: Map<string, number>
): DsaStrengthItem[] => {
  const base = new Map<DsaSubtopicKey, DsaStrengthItem>();
  DSA_SUBTOPICS.forEach((t) => {
    base.set(t.key, {
      key: t.key,
      label: t.label,
      total: 0,
      solved: 0,
      scoreAvg: 0,
      strength: 0,
    });
  });

  const scoreBuckets = new Map<DsaSubtopicKey, number[]>();
  questions.forEach((q) => {
    const key = matchSubtopic(q);
    const item = base.get(key);
    if (item) item.total += 1;
    const score = scoreByQuestion.get(q.id);
    if (solvedIds.has(q.id)) {
      if (item) item.solved += 1;
      if (typeof score === 'number') {
        const bucket = scoreBuckets.get(key) || [];
        bucket.push(score);
        scoreBuckets.set(key, bucket);
      }
    }
  });

  for (const [key, item] of base.entries()) {
    const scores = scoreBuckets.get(key) || [];
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const completion = item.total > 0 ? (item.solved / item.total) * 100 : 0;
    const blended = scores.length > 0 ? (avgScore * 0.7 + completion * 0.3) : completion;
    item.scoreAvg = Number(avgScore.toFixed(1));
    item.strength = Number(blended.toFixed(1));
  }

  return Array.from(base.values()).filter((i) => i.total > 0);
};

