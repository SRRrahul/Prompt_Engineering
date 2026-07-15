import mongoose, { Schema, Document, model } from 'mongoose';

export interface IQuestion extends Document {
  _id: string;
  text: string;
  modelAnswer: string;
  rubric: string;
  marks: number;
  createdBy?: string;
  createdAt: string;
}

import { uid } from '../config/db';

const QuestionSchema = new Schema<IQuestion>({
  _id: { type: String, default: uid },
  text: { type: String, required: true },
  modelAnswer: { type: String, required: true },
  rubric: { type: String, required: true },
  marks: { type: Number, default: 10 },
  createdBy: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export default model<IQuestion>('Question', QuestionSchema);
