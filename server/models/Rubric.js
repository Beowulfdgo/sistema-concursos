const mongoose = require('mongoose');

const criterionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  minScore: { type: Number, required: true, default: 0 },
  maxScore: { type: Number, required: true },
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  maxPoints: { type: Number, required: true },
  criteria: [criterionSchema],
});

const rubricSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  totalPoints: { type: Number, default: 0 },
  sections: [sectionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isTemplate: { type: Boolean, default: false },
}, { timestamps: true });

rubricSchema.pre('save', function(next) {
  this.totalPoints = this.sections.reduce((sum, s) => sum + s.maxPoints, 0);
  next();
});

module.exports = mongoose.model('Rubric', rubricSchema);
