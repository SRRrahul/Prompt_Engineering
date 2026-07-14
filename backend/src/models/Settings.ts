import mongoose, { Schema, Document, model } from 'mongoose';

export interface ISettings extends Document {
  _id: string;
  timerDurationMinutes: number;
  questionsPerExam: number;
  minWordCount: number;
  maxViolationsBeforeAutoSubmit: number;
}

const SettingsSchema = new Schema<ISettings>({
  _id: { type: String, default: 'singleton' },
  timerDurationMinutes: { type: Number, default: 60 },
  questionsPerExam: { type: Number, default: 1 },
  minWordCount: { type: Number, default: 250 },
  maxViolationsBeforeAutoSubmit: { type: Number, default: 5 },
});

export default model<ISettings>('Settings', SettingsSchema);
