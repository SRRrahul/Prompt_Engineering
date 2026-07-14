import mongoose, { Schema, Document, model } from 'mongoose';

export interface IExamSession extends Document {
  examinerId: string;
  questionOrder: string; // JSON string of question IDs
  startTime?: string;
  endTime?: string;
  status: string;
  violationCount: number;
  violationLog: string; // JSON string
  durationMinutes: number;
}

const ExamSessionSchema = new Schema<IExamSession>({
  examinerId: { type: String, required: true },
  questionOrder: { type: String, default: '[]' },
  startTime: { type: String },
  endTime: { type: String },
  status: { type: String, default: 'not_started' },
  violationCount: { type: Number, default: 0 },
  violationLog: { type: String, default: '[]' },
  durationMinutes: { type: Number, default: 60 },
});

export default model<IExamSession>('ExamSession', ExamSessionSchema);
