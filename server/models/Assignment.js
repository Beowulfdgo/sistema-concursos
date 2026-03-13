const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

assignmentSchema.index({ contestId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
