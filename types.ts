
export enum TaskType {
  TASK_1_ACADEMIC = 'Academic Task 1',
  TASK_1_GENERAL = 'General Task 1',
  TASK_2_ESSAY = 'Task 2 Essay'
}

export interface FeedbackCriteria {
  score: number;
  feedback: string;
}

export interface GrammarError {
  original: string;
  correction: string;
  explanation: string;
  type: 'Grammar' | 'Spelling' | 'Punctuation' | 'Style';
}

export interface IELTSFeedback {
  overallScore: number;
  cefrLevel: string;
  mentorNote: string; // New field for human-like summary
  taskResponse: FeedbackCriteria;
  coherenceCohesion: FeedbackCriteria;
  lexicalResource: FeedbackCriteria;
  grammaticalRange: FeedbackCriteria;
  correctedText: string;
  keyImprovements: string[];
  vocabularyHighlights: { word: string; suggestion: string; reason: string }[];
  detailedErrors: GrammarError[];
}

export interface WritingSubmission {
  id: string;
  timestamp: number;
  taskType: TaskType;
  question: string;
  userText: string;
  taskImage?: string; 
  submissionImage?: string; 
  feedback?: IELTSFeedback;
}
