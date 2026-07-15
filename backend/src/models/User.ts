import mongoose, { Schema, Document, model } from 'mongoose';

export interface IUser extends Document {
  role: 'examiner' | 'admin';
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  department?: string;
  examStatus: string;
  registeredAt: string;
}

import { uid } from '../config/db';

const UserSchema = new Schema<IUser>({
  _id: { type: String, default: uid },
  role: { type: String, required: true, enum: ['examiner', 'admin'] },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  department: { type: String, default: '' },
  examStatus: { type: String, default: 'not_started' },
  registeredAt: { type: String, default: () => new Date().toISOString() },
});

export default model<IUser>('User', UserSchema);
