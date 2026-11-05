import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professional',
      required: true,
      index: true
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 30
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true,
      index: true
    },
    sessionStatus: {
      type: String,
      enum: ['WAITING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true
    },
    endedBy: {
      type: String, // 'user' | 'professional' | 'timeout' | 'admin'
      default: ''
    },
    endedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export const ChatSessionModel = mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema);
export default ChatSessionModel;
