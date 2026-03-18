import {
  dsm5Level1AdultDefinition,
  type AssessmentDefinition,
  type ThresholdType,
} from "@/lib/dsm5";

export interface DomainScore {
  domain: string;
  thresholdType: ThresholdType;
  average: number;
  max: number;
  total: number;
  count: number;
  flagged: boolean;
  severity: string;
  answers: Array<{ questionId: number; score: number }>;
}

export interface DiagnosisRule {
  id: string;
  name: string;
  required_domains: string[];
  excluded_domains: string[];
  min_strength: number;
  priority: number;
  active: boolean;
}

export interface DiagnosisCandidate {
  ruleId: string;
  label: string;
  priority: number;
  confidenceScore: number;
  supportingDomains: string[];
}

export interface ScoringResult {
  totalScore: number;
  answeredCount: number;
  missingQuestionIds: number[];
  domainScores: DomainScore[];
  flaggedDomains: string[];
  primaryDiagnosis: DiagnosisCandidate;
  differentialDiagnoses: DiagnosisCandidate[];
  note: string;
}

const thresholdValue: Record<ThresholdType, number> = {
  mild_or_more: 3,
  slight_or_more: 2,
};

function mapSeverity(value: number): string {
  if (value >= 5) return "Severe";
  if (value >= 4) return "Moderate";
  if (value >= 3) return "Mild";
  if (value >= 2) return "Slight";
  return "None";
}

function normalizeRule(rule: Partial<DiagnosisRule>): DiagnosisRule {
  const required = Array.isArray(rule.required_domains)
    ? rule.required_domains.filter((item): item is string => typeof item === "string")
    : [];
  const excluded = Array.isArray(rule.excluded_domains)
    ? rule.excluded_domains.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id: String(rule.id ?? ""),
    name: String(rule.name ?? "Unknown Provisional Diagnosis"),
    required_domains: required,
    excluded_domains: excluded,
    min_strength: Number.isFinite(rule.min_strength) ? Number(rule.min_strength) : 1,
    priority: Number.isFinite(rule.priority) ? Number(rule.priority) : 100,
    active: Boolean(rule.active),
  };
}

function computeConfidence(avgDomainSeverity: number, supportingCount: number): number {
  const normalized = avgDomainSeverity / 5;
  const confidence = 0.4 + normalized * 0.35 + Math.min(0.2, supportingCount * 0.05);
  return Number(Math.min(0.95, Math.max(0.35, confidence)).toFixed(2));
}

function fallbackDiagnosis(flaggedDomains: string[]): DiagnosisCandidate {
  return {
    ruleId: "fallback",
    label:
      flaggedDomains.length > 0
        ? "Cross-Cutting Symptoms Present (Needs Clinical Correlation)"
        : "No Significant Cross-Cutting Elevation",
    priority: 999,
    confidenceScore: flaggedDomains.length > 0 ? 0.45 : 0.9,
    supportingDomains: flaggedDomains,
  };
}

export function evaluateAssessment(
  answers: Record<number, number>,
  rules: Partial<DiagnosisRule>[],
  definition: AssessmentDefinition = dsm5Level1AdultDefinition,
): ScoringResult {
  const questionIds = new Set(definition.questions.map((q) => q.id));
  const filteredAnswers = Object.entries(answers).reduce<Record<number, number>>((acc, [rawId, rawScore]) => {
    const questionId = Number(rawId);
    const score = Number(rawScore);
    if (questionIds.has(questionId) && Number.isInteger(score) && score >= 1 && score <= 5) {
      acc[questionId] = score;
    }
    return acc;
  }, {});

  const missingQuestionIds = definition.questions
    .filter((question) => filteredAnswers[question.id] === undefined)
    .map((question) => question.id);

  const domainScores = definition.domains.map((domain) => {
    const domainQuestions = definition.questions.filter((question) => question.domain === domain.id);
    const answersForDomain = domainQuestions.map((question) => ({
      questionId: question.id,
      score: filteredAnswers[question.id] ?? 1,
    }));

    const total = answersForDomain.reduce((sum, item) => sum + item.score, 0);
    const max = answersForDomain.reduce((highest, item) => Math.max(highest, item.score), 1);
    const count = answersForDomain.length;
    const average = Number((total / count).toFixed(2));
    const flagged = max >= thresholdValue[domain.thresholdType];

    return {
      domain: domain.id,
      thresholdType: domain.thresholdType,
      average,
      max,
      total,
      count,
      flagged,
      severity: mapSeverity(max),
      answers: answersForDomain,
    };
  });

  const totalScore = Object.values(filteredAnswers).reduce((sum, score) => sum + score, 0);
  const flaggedDomains = domainScores.filter((item) => item.flagged).map((item) => item.domain);

  const activeRules = rules.map(normalizeRule).filter((rule) => rule.active);
  const candidates = activeRules
    .filter((rule) => {
      const hasAllRequired = rule.required_domains.every((domain) => flaggedDomains.includes(domain));
      const hasExcluded = rule.excluded_domains.some((domain) => flaggedDomains.includes(domain));
      return hasAllRequired && !hasExcluded;
    })
    .map((rule) => {
      const supportingDomainScores = domainScores.filter((item) => rule.required_domains.includes(item.domain));
      const strength = supportingDomainScores.reduce((sum, item) => sum + item.max, 0);
      const averageSeverity =
        supportingDomainScores.length > 0
          ? supportingDomainScores.reduce((sum, item) => sum + item.max, 0) / supportingDomainScores.length
          : 1;

      return {
        ruleId: rule.id,
        label: rule.name,
        priority: rule.priority,
        strength,
        confidenceScore: computeConfidence(averageSeverity, rule.required_domains.length),
        supportingDomains: rule.required_domains,
        minStrength: rule.min_strength,
      };
    })
    .filter((candidate) => candidate.strength >= candidate.minStrength)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.confidenceScore !== b.confidenceScore) return b.confidenceScore - a.confidenceScore;
      return b.strength - a.strength;
    })
    .map(({ minStrength: _minStrength, strength: _strength, ...candidate }) => candidate);

  const primaryDiagnosis = candidates[0] ?? fallbackDiagnosis(flaggedDomains);
  const differentialDiagnoses = candidates.slice(1, 3);

  return {
    totalScore,
    answeredCount: Object.keys(filteredAnswers).length,
    missingQuestionIds,
    domainScores,
    flaggedDomains,
    primaryDiagnosis,
    differentialDiagnoses,
    note:
      "DSM-5 Level 1 is a cross-cutting symptom screener. Provisional labels support, but do not replace, clinician diagnosis.",
  };
}
