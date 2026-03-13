const Evaluation = require('../models/Evaluation');
const Project = require('../models/Project');
const Rubric = require('../models/Rubric');

exports.getProjectEvaluations = async (req, res, next) => {
  try {
    const filter = { projectId: req.params.projectId };
    if (req.user.role === 'reviewer') filter.reviewerId = req.user.id;
    const evaluations = await Evaluation.find(filter)
      .populate('reviewerId', 'name email')
      .populate('rubricId', 'name');
    res.json(evaluations);
  } catch (err) { next(err); }
};

exports.getEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('reviewerId', 'name email')
      .populate('projectId', 'title registrationNumber')
      .populate('rubricId', 'name');
    if (!evaluation) return res.status(404).json({ message: 'Evaluación no encontrada.' });
    res.json(evaluation);
  } catch (err) { next(err); }
};

exports.createOrUpdateEvaluation = async (req, res, next) => {
  try {
    const { projectId, contestId, sections, generalComments, plagiarismPercentage, aiPercentage, status } = req.body;

    let evaluation = await Evaluation.findOne({ projectId, reviewerId: req.user.id });
    if (evaluation && evaluation.status === 'submitted')
      return res.status(400).json({ message: 'Esta evaluación ya fue enviada y no puede modificarse.' });

    // Get rubric from project's contest
    const project = await Project.findById(projectId).populate('contestId');
    const rubricId = project?.contestId?.rubricId;

    const evalData = { projectId, contestId, reviewerId: req.user.id, rubricId, sections, generalComments, plagiarismPercentage, aiPercentage, status: status || 'draft' };

    if (evaluation) {
      Object.assign(evaluation, evalData);
    } else {
      evaluation = new Evaluation(evalData);
    }

    await evaluation.save();

    // Update project status
    if (status === 'submitted') {
      const project = await Project.findById(projectId);
      if (project) {
        project.status = 'under_review';
        const scoreEntry = project.scoreDetails.find(s => s.reviewerId.toString() === req.user.id);
        if (scoreEntry) { scoreEntry.score = evaluation.totalScore; scoreEntry.submittedAt = new Date(); }
        else project.scoreDetails.push({ reviewerId: req.user.id, score: evaluation.totalScore, submittedAt: new Date() });
        // Calculate final score (average of all submitted evaluations)
        const allEvals = await Evaluation.find({ projectId, status: 'submitted' });
        if (allEvals.length > 0) {
          project.finalScore = allEvals.reduce((s, e) => s + e.totalScore, 0) / allEvals.length;
          project.status = 'evaluated';
        }
        await project.save();
      }
    }

    res.status(evaluation.isNew ? 201 : 200).json(evaluation);
  } catch (err) { next(err); }
};

exports.submitEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findOne({ _id: req.params.id, reviewerId: req.user.id });
    if (!evaluation) return res.status(404).json({ message: 'Evaluación no encontrada.' });
    if (evaluation.status === 'submitted') return res.status(400).json({ message: 'Ya fue enviada.' });

    evaluation.status = 'submitted';
    evaluation.submittedAt = new Date();
    await evaluation.save();

    // Update project
    const project = await Project.findById(evaluation.projectId);
    if (project) {
      const allEvals = await Evaluation.find({ projectId: evaluation.projectId, status: 'submitted' });
      project.finalScore = allEvals.reduce((s, e) => s + e.totalScore, 0) / allEvals.length;
      project.status = 'evaluated';
      project.scoreDetails = allEvals.map(e => ({ reviewerId: e.reviewerId, score: e.totalScore, submittedAt: e.submittedAt }));
      await project.save();
    }

    res.json({ message: 'Evaluación enviada exitosamente.', evaluation });
  } catch (err) { next(err); }
};
