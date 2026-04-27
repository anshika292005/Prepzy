import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: string;
  topic: string;
  examType: string;
  totalQuestions: number;
  correctCount: number;
  durationSeconds: number;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      index: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    examType: {
      type: String,
      required: [true, 'Exam type is required'],
      enum: {
        values: ['JEE', 'UPSC', 'BOTH'],
        message: 'Exam type must be JEE, UPSC, or BOTH',
      },
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: [1, 'Must have at least 1 question'],
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
    },
    durationSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

const Session = mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);

export default Session;
