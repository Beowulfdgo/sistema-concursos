const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
});

const contestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  edition: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  periodicity: { type: String, enum: ['monthly', 'annual'], default: 'annual' },
  status: { type: String, enum: ['draft', 'active', 'closed', 'archived'], default: 'draft' },
  rubricId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rubric' },
  categories: [categorySchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

contestSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate >= now;
});

module.exports = mongoose.model('Contest', contestSchema);
