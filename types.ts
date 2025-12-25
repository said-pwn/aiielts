
export enum Language {
  EN = 'en',
  RU = 'ru'
}

export enum TaskType {
  TASK1 = 'Task 1',
  TASK2 = 'Task 2'
}

export interface CriterionFeedback {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
}

export interface IELTSEvaluation {
  overallBand: number;
  taskResponse: CriterionFeedback;
  coherenceCohesion: CriterionFeedback;
  lexicalResource: CriterionFeedback;
  grammaticalRange: CriterionFeedback;
  detailedAnalysis: string;
  improvedVersion: string;
  wordCount: number;
}

export interface WritingSubmission {
  taskType: TaskType;
  prompt: string;
  essay: string;
}
