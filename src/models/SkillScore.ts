import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillScore extends Document {
  userId: string;
  topic: string;
  subtopic: string;
  skillScore: number;
  totalQuestions: number;
  correctCount: number;
  lastPracticed: Date;
}

const skillScoreSchema = new Schema<ISkillScore>({
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
  subtopic: {
    type: String,
    trim: true,
    default: 'General',
  },
  skillScore: {
    type: Number,
    default: 1200,
    min: [600, 'Skill score cannot be below 600'],
    max: [2000, 'Skill score cannot exceed 2000'],
  },
  totalQuestions: {
    type: Number,
    default: 0,
    min: 0,
  },
  correctCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastPracticed: {
    type: Date,
    default: null,
  },
});

// Compound unique index: one record per (userId, topic, subtopic)
skillScoreSchema.index({ userId: 1, topic: 1, subtopic: 1 }, { unique: true });

const SkillScore = mongoose.models.SkillScore || mongoose.model<ISkillScore>('SkillScore', skillScoreSchema);

export default SkillScore;
