import mongoose from 'mongoose';

const chatRequestSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    message: { type: String, default: 'Hello, I would like to discuss my floor plan project.' },
    projectId: { type: String, default: null },
    projectSnapshot: {
      id: String,
      name: String,
      houseType: String,
      plotWidth: Number,
      plotLength: Number,
      unit: String,
      thumbnail: String,
      roomsCount: Number
    }
  },
  { timestamps: true }
);

chatRequestSchema.index({ senderId: 1, receiverId: 1, status: 1 });

export const ChatRequestModel = mongoose.models.ChatRequest || mongoose.model('ChatRequest', chatRequestSchema);
export default ChatRequestModel;
