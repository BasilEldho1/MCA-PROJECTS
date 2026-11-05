import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    messageType: {
      type: String,
      enum: ['text', 'project_share'],
      default: 'text'
    },
    sharedProject: {
      id: String,
      name: String,
      houseType: String,
      plotWidth: Number,
      plotLength: Number,
      unit: String,
      floorsCount: Number,
      thumbnail: String,
      walls: Array,
      rooms: Array,
      doors: Array,
      windows: Array,
      furniture: Array
    },
    readStatus: { type: Boolean, default: false }
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const MessageModel = mongoose.models.Message || mongoose.model('Message', messageSchema);
export default MessageModel;
