import mongoose, { Schema, Document, model } from 'mongoose';

export interface IQuestion extends Document {
  text: string;
  modelAnswer: string;
  rubric: string;
  marks: number;
  createdBy?: string;
  createdAt: string;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  modelAnswer: { type: String, required: true },
  rubric: { type: String, required: true },
  marks: { type: Number, default: 10 },
  createdBy: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export default model<IQuestion>('Question', QuestionSchema);
