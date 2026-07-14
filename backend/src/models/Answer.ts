import mongoose, { Schema, Document, model } from 'mongoose';

export interface IAnswer extends Document {
  sessionId: string;
  questionId: string;
  examinerId: string;
  answerText: string;
  wordCount: number;
  aiScore?: number | null;
  aiFeedback?: string | null;
  isGraded: boolean;
  submittedAt?: string | null;
  gradingError?: boolean;
  accuracyPercentage?: number | null;
  matchedPoints?: string | null;
  missingPoints?: string | null;
  adminOverrideScore?: number | null;
  adminNotes?: string | null;
}

const AnswerSchema = new Schema<IAnswer>({
  sessionId: { type: String, required: true },
  questionId: { type: String, required: true },
  examinerId: { type: String, required: true },
  answerText: { type: String, default: '' },
  wordCount: { type: Number, default: 0 },
  aiScore: { type: Number, default: null },
  aiFeedback: { type: String, default: null },
  isGraded: { type: Boolean, default: false },
  submittedAt: { type: String, default: null },
  gradingError: { type: Boolean, default: false },
  accuracyPercentage: { type: Number, default: null },
  matchedPoints: { type: String, default: null },
  missingPoints: { type: String, default: null },
  adminOverrideScore: { type: Number, default: null },
  adminNotes: { type: String, default: null },
});

export default model<IAnswer>('Answer', AnswerSchema);
