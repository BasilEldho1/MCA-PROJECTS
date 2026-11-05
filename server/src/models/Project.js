import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    projectId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    houseType: { type: String, default: 'Villa' },
    plotWidth: { type: Number, default: 40 },
    plotLength: { type: Number, default: 50 },
    unit: { type: String, enum: ['feet', 'meters'], default: 'feet' },
    floorsCount: { type: Number, default: 1 },
    thumbnail: { type: String, default: '' },
    walls: { type: Array, default: [] },
    rooms: { type: Array, default: [] },
    doors: { type: Array, default: [] },
    windows: { type: Array, default: [] },
    furniture: { type: Array, default: [] },
    floorsData: { type: Array, default: [] },
    blueprintOverlay: { type: Object, default: null },
    buildingDetails: { type: Object, default: {} },
    conversionData: { type: Object, default: {} },
    cameraSettings: { type: Object, default: {} },
    gridSettings: { type: Object, default: {} },
    sharedWith: [
      {
        professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permission: { type: String, enum: ['view', 'edit'], default: 'view' },
        sharedAt: { type: Date, default: Date.now },
        format: { type: String, default: 'pdf' },
        files: { type: Array, default: [] },
        message: { type: String, default: '' }
      }
    ],
    isPublic: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const ProjectModel = mongoose.models.Project || mongoose.model('Project', projectSchema);
export default ProjectModel;
