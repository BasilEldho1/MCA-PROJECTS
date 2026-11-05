import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    projectId: { type: String, default: null },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export const ConversationModel = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
export default ConversationModel;
