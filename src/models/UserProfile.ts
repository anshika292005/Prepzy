import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfile extends Document {
  authId: string;
  name: string;
  examType: 'JEE' | 'UPSC' | 'BOTH';
  targetYear: number;
  createdAt: Date;
}

const userProfileSchema = new Schema<IUserProfile>(
  {
    authId: {
      type: String,
      required: [true, 'authId is required'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    examType: {
      type: String,
      required: [true, 'Exam type is required'],
      enum: {
        values: ['JEE', 'UPSC', 'BOTH'],
        message: 'Exam type must be JEE, UPSC, or BOTH',
      },
    },
    targetYear: {
      type: Number,
      required: [true, 'Target year is required'],
      min: [2024, 'Target year must be 2024 or later'],
      max: [2030, 'Target year cannot exceed 2030'],
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

const UserProfile = mongoose.model<IUserProfile>('UserProfile', userProfileSchema);

export default UserProfile;
