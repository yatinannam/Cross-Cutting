import { dsm5Level1AdultDefinition, type AssessmentDefinition } from "@/lib/dsm5";

export type AssessmentFormKey = "dsm5_level1_adult" | "capacity_assessment";

export interface AssessmentFormOption {
  key: AssessmentFormKey;
  label: string;
  description: string;
}

export const assessmentFormOptions: AssessmentFormOption[] = [
  {
    key: "dsm5_level1_adult",
    label: "DSM-5 Level 1 Adult",
    description: "23 domains, 1 to 5 severity scale",
  },
  {
    key: "capacity_assessment",
    label: "Capacity Assessment",
    description: "Clinical decision capacity workflow",
  },
];

export const dsm5AssessmentDefinition = {
  key: "dsm5_level1_adult" as const,
  type: "symptom_scale" as const,
  ...dsm5Level1AdultDefinition,
};

export interface CapacityQuestionDefinition {
  id: string;
  text: string;
  type: "boolean" | "choice" | "output";
  options: string[];
  flow?: Record<string, string>;
  sectionId: string;
}

export interface CapacitySectionDefinition {
  id: string;
  title: string;
  questions: CapacityQuestionDefinition[];
}

export interface CapacityAssessmentDefinition {
  key: AssessmentFormKey;
  title: string;
  type: "clinical_form";
  sections: CapacitySectionDefinition[];
}

export const capacityAssessmentDefinition: CapacityAssessmentDefinition = {
  key: "capacity_assessment",
  title: "Capacity Assessment for Treatment decisions including Admission",
  type: "clinical_form",
  sections: [
    {
      id: "0",
      title: "Obvious lack of capacity",
      questions: [
        {
          id: "0.1",
          text:
            "Is he/she in a condition, that that one cannot have any kind of meaningful conversation with him/her (such as being violent, excited, catatonic, stuporous, delirious, under alcohol or substance intoxication/severe withdrawal, or any other (explain below))?",
          type: "boolean",
          options: ["Yes", "No"],
          flow: {
            Yes: "4",
            No: "1A",
          },
          sectionId: "0",
        },
      ],
    },
    {
      id: "1",
      title:
        "Understanding the information that is relevant to take a decision on the treatment or admission or personal assistance (Understands the nature and consequences of the decision; possible options explained)",
      questions: [
        {
          id: "1A",
          text: "Is the individual oriented to time, place and person?",
          type: "choice",
          options: ["Yes", "No", "Cannot assess"],
          sectionId: "1",
        },
        {
          id: "1B",
          text: "Has he/she been provided relevant information about mental healthcare and treatment pertaining to the illness in question?",
          type: "choice",
          options: ["Yes", "No"],
          sectionId: "1",
        },
        {
          id: "1C",
          text: "Is he/she able to follow simple commands like (i) show your tongue (ii) close your eyes?",
          type: "choice",
          options: ["Yes", "No", "Cannot assess"],
          sectionId: "1",
        },
        {
          id: "1D",
          text: "Does he/she acknowledge that he has a mental illness?",
          type: "choice",
          options: ["Yes", "No", "Cannot assess"],
          sectionId: "1",
        },
      ],
    },
    {
      id: "2",
      title:
        "Appreciating reasonably foreseeable consequence of a decision or lack of decision on the treatment or admission or personal assistance",
      questions: [
        {
          id: "2A",
          text: "Does the individual agree to receive treatment suggested by the treating team?",
          type: "choice",
          options: ["Yes", "No", "Cannot assess"],
          flow: {
            Yes: "2B",
            No: "2C",
            "Cannot assess": "3A",
          },
          sectionId: "2",
        },
        {
          id: "2B",
          text: "Does he/she explain why he/she has agreed to receive treatment?",
          type: "choice",
          options: ["Yes", "No", "Cannot assess"],
          flow: {
            Yes: "3A",
            No: "3A",
            "Cannot assess": "3A",
          },
          sectionId: "2",
        },
        {
          id: "2C",
          text: "Does he/she explain why he/she does not agree to receive treatment?",
          type: "choice",
          options: ["Yes", "No", "Cannot assess"],
          flow: {
            Yes: "3A",
            No: "3A",
            "Cannot assess": "3A",
          },
          sectionId: "2",
        },
      ],
    },
    {
      id: "3",
      title:
        "Communicating the decision as per question (1) by means of speech, expression, gesture or any other means (Specify)",
      questions: [
        {
          id: "3A",
          text: "Is the individual able to communicate his/her decision by means of speech, writing, expression, gesture or any other means?",
          type: "choice",
          options: ["Yes", "No", "Cannot assess"],
          flow: {
            Yes: "4",
            No: "4",
            "Cannot assess": "4",
          },
          sectionId: "3",
        },
      ],
    },
    {
      id: "4",
      title: "Final Clinical Decision",
      questions: [
        {
          id: "4",
          text: "Select the final clinical decision based on the assessment.",
          type: "output",
          options: [
            "Has capacity for treatment decisions including admission",
            "Needs 100% support from his/her nominated representative in making treatment decisions including admission",
          ],
          sectionId: "4",
        },
      ],
    },
  ],
};

export function getAssessmentFormOption(key: AssessmentFormKey): AssessmentFormOption {
  return (
    assessmentFormOptions.find((option) => option.key === key) ?? assessmentFormOptions[0]
  );
}

function normalizeAssessmentFormKey(key?: string): AssessmentFormKey {
  const normalized = (key ?? "").trim().toLowerCase();

  if (normalized === "capacity_assessment" || normalized.includes("capacity")) {
    return "capacity_assessment";
  }

  return "dsm5_level1_adult";
}

export function getAssessmentFormDefinition(key?: string) {
  if (normalizeAssessmentFormKey(key) === "capacity_assessment") {
    return capacityAssessmentDefinition;
  }

  return dsm5AssessmentDefinition;
}

export function getAssessmentFormTitle(key?: string) {
  return getAssessmentFormOption(normalizeAssessmentFormKey(key)).label;
}

export function getCapacityQuestionOrder() {
  return capacityAssessmentDefinition.sections.flatMap((section) => section.questions);
}

export function getCapacityQuestionById(questionId: string) {
  return getCapacityQuestionOrder().find((question) => question.id === questionId);
}

export function getCapacityNextQuestionId(
  questionId: string,
  answerValue: string,
): string | null {
  const currentQuestion = getCapacityQuestionById(questionId);
  if (!currentQuestion) return null;

  const flowTarget = currentQuestion.flow?.[answerValue];
  if (flowTarget) return flowTarget;

  const orderedQuestions = getCapacityQuestionOrder();
  const currentIndex = orderedQuestions.findIndex((question) => question.id === questionId);
  if (currentIndex === -1) return null;

  return orderedQuestions[currentIndex + 1]?.id ?? null;
}

export function traceCapacityQuestionPath(answers: Record<string, string>) {
  const orderedQuestions = getCapacityQuestionOrder();
  const visited: string[] = [];
  let currentQuestionId = orderedQuestions[0]?.id ?? null;

  while (currentQuestionId) {
    visited.push(currentQuestionId);
    const currentAnswer = answers[currentQuestionId];

    if (!currentAnswer) {
      break;
    }

    const nextQuestionId = getCapacityNextQuestionId(currentQuestionId, currentAnswer);
    if (!nextQuestionId || nextQuestionId === currentQuestionId) {
      break;
    }

    currentQuestionId = nextQuestionId;
  }

  return {
    path: visited,
    currentQuestionId: visited[visited.length - 1] ?? orderedQuestions[0]?.id ?? null,
    totalQuestions: orderedQuestions.length,
  };
}

export interface CapacityEvaluationResult {
  totalScore: number;
  answeredCount: number;
  missingQuestionIds: string[];
  primaryDecision: string;
  note: string;
}

export function evaluateCapacityAssessment(answers: Record<string, string>): CapacityEvaluationResult {
  const path = traceCapacityQuestionPath(answers);
  const orderedQuestions = getCapacityQuestionOrder();
  const missingQuestionIds: string[] = [];

  for (const questionId of path.path) {
    if (!answers[questionId]) {
      missingQuestionIds.push(questionId);
      break;
    }
  }

  const finalDecision = answers["4"] ?? "Needs 100% support from his/her nominated representative in making treatment decisions including admission";
  const totalScore = finalDecision.startsWith("Has capacity") ? 1 : 0;

  return {
    totalScore,
    answeredCount: Object.keys(answers).length,
    missingQuestionIds,
    primaryDecision: finalDecision,
    note:
      "Capacity assessment completed. The final clinical decision should be interpreted alongside the documented responses and clinical context.",
  };
}

export type { AssessmentDefinition } from "@/lib/dsm5";
