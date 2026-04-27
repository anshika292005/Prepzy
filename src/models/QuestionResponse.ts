import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionResponse extends Document {
  sessionId: string;
  questionText: string;
  options: Record<string, string>;
  correctOption: string;
  studentAnswer: string;
  isCorrect: boolean;
  difficulty: string;
  aiExplanation: string;
  topic: string;
  subtopic: string;
}

const questionResponseSchema = new Schema<IQuestionResponse>({
  sessionId: {
    type: String,
    required: [true, 'sessionId is required'],
    index: true,
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
  },
  options: {
    type: Schema.Types.Mixed,
    required: [true, 'Options are required'],
  },
  correctOption: {
    type: String,
    required: [true, 'Correct option is required'],
    enum: ['A', 'B', 'C', 'D'],
  },
  studentAnswer: {
    type: String,
    required: [true, 'Student answer is required'],
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
  },
  aiExplanation: {
    type: String,
    default: '',
  },
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  subtopic: {
    type: String,
    trim: true,
    default: 'General',
  },
});

const QuestionResponse = mongoose.models.QuestionResponse || mongoose.model<IQuestionResponse>(
  'QuestionResponse',
  questionResponseSchema
);

export default QuestionResponse;
