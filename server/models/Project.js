const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  isRepresentative: { type: Boolean, default: false },
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId },
  categoryName: { type: String },
  representative: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamMembers: [teamMemberSchema],
  filePath: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  registrationNumber: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['submitted', 'under_review', 'evaluated'], default: 'submitted' },
  finalScore: { type: Number },
  scoreDetails: [{
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    submittedAt: Date,
  }],
}, { timestamps: true });

// Auto-generate registration number
projectSchema.pre('save', async function(next) {
  if (!this.registrationNumber) {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await mongoose.model('Project').countDocuments();
    this.registrationNumber = `${year}-PRJ${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
