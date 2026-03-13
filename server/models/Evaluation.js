const mongoose = require('mongoose');

const criterionScoreSchema = new mongoose.Schema({
  criterionId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String },
  score: { type: Number, default: 0 },
  minScore: { type: Number },
  maxScore: { type: Number },
  comment: { type: String },
});

const evalSectionSchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId },
  title: { type: String },
  maxPoints: { type: Number },
  criteria: [criterionScoreSchema],
  sectionTotal: { type: Number, default: 0 },
});

const evaluationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rubricId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rubric' },
  sections: [evalSectionSchema],
  generalComments: { type: String },
  plagiarismPercentage: { type: Number },
  aiPercentage: { type: Number },
  totalScore: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
  submittedAt: { type: Date },
}, { timestamps: true });

evaluationSchema.pre('save', function(next) {
  this.totalScore = this.sections.reduce((sum, s) => {
    s.sectionTotal = s.criteria.reduce((cs, c) => cs + (c.score || 0), 0);
    return sum + s.sectionTotal;
  }, 0);
  next();
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
