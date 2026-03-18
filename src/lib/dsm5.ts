export type ThresholdType = "mild_or_more" | "slight_or_more";

export interface DomainDefinition {
  id: string;
  thresholdType: ThresholdType;
}

export interface QuestionDefinition {
  id: number;
  text: string;
  domain: string;
}

export interface AssessmentDefinition {
  title: string;
  scale: {
    min: number;
    max: number;
    labels: Record<string, string>;
  };
  domains: DomainDefinition[];
  questions: QuestionDefinition[];
}

export const dsm5Level1AdultDefinition: AssessmentDefinition = {
  title: "DSM-5 Level 1 Cross-Cutting Symptom Measure (Adult)",
  scale: {
    min: 1,
    max: 5,
    labels: {
      "1": "None",
      "2": "Slight",
      "3": "Mild",
      "4": "Moderate",
      "5": "Severe",
    },
  },
  domains: [
    { id: "depression", thresholdType: "mild_or_more" },
    { id: "anger", thresholdType: "mild_or_more" },
    { id: "mania", thresholdType: "mild_or_more" },
    { id: "anxiety", thresholdType: "mild_or_more" },
    { id: "somatic", thresholdType: "mild_or_more" },
    { id: "suicidal_ideation", thresholdType: "slight_or_more" },
    { id: "psychosis", thresholdType: "slight_or_more" },
    { id: "sleep", thresholdType: "mild_or_more" },
    { id: "memory", thresholdType: "mild_or_more" },
    { id: "repetitive", thresholdType: "mild_or_more" },
    { id: "dissociation", thresholdType: "mild_or_more" },
    { id: "personality", thresholdType: "mild_or_more" },
    { id: "substance_use", thresholdType: "slight_or_more" },
  ],
  questions: [
    { id: 1, text: "Little interest or pleasure in doing things?", domain: "depression" },
    { id: 2, text: "Feeling down, depressed, or hopeless?", domain: "depression" },
    { id: 3, text: "Feeling more irritated, grouchy, or angry than usual?", domain: "anger" },
    { id: 4, text: "Sleeping less than usual, but still have a lot of energy?", domain: "mania" },
    {
      id: 5,
      text: "Starting lots more projects than usual or doing more risky things than usual?",
      domain: "mania",
    },
    {
      id: 6,
      text: "Feeling nervous, anxious, frightened, worried, or on edge?",
      domain: "anxiety",
    },
    { id: 7, text: "Feeling panic or being frightened?", domain: "anxiety" },
    { id: 8, text: "Avoiding situations that make you anxious?", domain: "anxiety" },
    {
      id: 9,
      text: "Unexplained aches and pains (e.g., head, back, joints, abdomen, legs)?",
      domain: "somatic",
    },
    {
      id: 10,
      text: "Feeling that your illnesses are not being taken seriously enough?",
      domain: "somatic",
    },
    { id: 11, text: "Thoughts of actually hurting yourself?", domain: "suicidal_ideation" },
    {
      id: 12,
      text: "Hearing things other people couldn't hear, such as voices even when no one was around?",
      domain: "psychosis",
    },
    {
      id: 13,
      text: "Feeling that someone could hear your thoughts, or that you could hear what another person was thinking?",
      domain: "psychosis",
    },
    { id: 14, text: "Problems with sleep that affected your sleep quality over all?", domain: "sleep" },
    {
      id: 15,
      text: "Problems with memory (e.g., learning new information) or with location (e.g., finding your way home)?",
      domain: "memory",
    },
    {
      id: 16,
      text: "Unpleasant thoughts, urges, or images that repeatedly enter your mind?",
      domain: "repetitive",
    },
    {
      id: 17,
      text: "Feeling driven to perform certain behaviors or mental acts over and over again?",
      domain: "repetitive",
    },
    {
      id: 18,
      text: "Feeling detached or distant from yourself, your body, your physical surroundings, or your memories?",
      domain: "dissociation",
    },
    {
      id: 19,
      text: "Not knowing who you really are or what you want out of life?",
      domain: "personality",
    },
    {
      id: 20,
      text: "Not feeling close to other people or enjoying your relationships with them?",
      domain: "personality",
    },
    {
      id: 21,
      text: "Drinking at least 4 drinks of any kind of alcohol in a single day?",
      domain: "substance_use",
    },
    {
      id: 22,
      text: "Smoking any cigarettes, a cigar, or pipe, or using snuff or chewing tobacco?",
      domain: "substance_use",
    },
    {
      id: 23,
      text: "Using any medicines on your own, in greater amounts or longer than prescribed (e.g., painkillers, stimulants, sedatives, marijuana, cocaine, ecstasy, hallucinogens, heroin, inhalants, methamphetamine)?",
      domain: "substance_use",
    },
  ],
};
