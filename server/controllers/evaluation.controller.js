const Evaluation = require('../models/Evaluation');
const Project = require('../models/Project');
const Rubric = require('../models/Rubric');

const calcTotals = (sections) => {
  let total = 0;
  sections.forEach(s => {
    let st = 0;
    s.criteria.forEach(c => { if (c.score !== null && c.score !== undefined) st += Number(c.score); });
    s.sectionTotal = st;
    total += st;
  });
  return total;
};

exports.getEvaluationsByProject = async (req, res, next) => {
  try {
    const evals = await Evaluation.find({ projectId: req.params.projectId })
      .populate('reviewerId', 'name email')
      .sort('-createdAt');
    res.json(evals);
  } catch (err) { next(err); }
};

exports.getEvaluationById = async (req, res, next) => {
  try {
    const ev = await Evaluation.findById(req.params.id)
      .populate('reviewerId', 'name email')
      .populate('projectId', 'title')
      .populate('rubricId', 'name');
    if (!ev) return res.status(404).json({ message: 'Evaluación no encontrada' });
    if (req.user.role === 'reviewer' && ev.reviewerId._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Acceso denegado' });
    res.json(ev);
  } catch (err) { next(err); }
};

exports.createEvaluation = async (req, res, next) => {
  try {
    const { projectId, sections, generalComments, plagiarismPercentage, aiPercentage, status } = req.body;

    const project = await Project.findById(projectId).populate('contestId', 'rubricId');
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });

    const rubricId = project.contestId.rubricId;
    const rubric = await Rubric.findById(rubricId);
    if (!rubric) return res.status(400).json({ message: 'El concurso no tiene rúbrica asignada' });

    // Build sections from rubric if not provided
    let evalSections = sections;
    if (!evalSections) {
      evalSections = rubric.sections.map(s => ({
        sectionId: s._id,
        title: s.title,
        maxPoints: s.maxPoints,
        criteria: s.criteria.map(c => ({
          criterionId: c._id,
          description: c.description,
          minScore: c.minScore,
          maxScore: c.maxScore,
          score: null,
        })),
        sectionTotal: 0,
      }));
    }

    const totalScore = calcTotals(evalSections);
    const ev = await Evaluation.create({
      projectId,
      contestId: project.contestId._id,
      reviewerId: req.user._id,
      rubricId,
      sections: evalSections,
      generalComments,
      plagiarismPercentage,
      aiPercentage,
      totalScore,
      status: status || 'draft',
      submittedAt: status === 'submitted' ? new Date() : undefined,
    });

    if (status === 'submitted') {
      await project.updateOne({ status: 'under_review' });
      await updateProjectFinalScore(projectId);
    }

    res.status(201).json(ev);
  } catch (err) { next(err); }
};

exports.updateEvaluation = async (req, res, next) => {
  try {
    const ev = await Evaluation.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Evaluación no encontrada' });
    if (ev.status === 'submitted') return res.status(400).json({ message: 'Evaluación ya enviada' });
    if (ev.reviewerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Acceso denegado' });

    const { sections, generalComments, plagiarismPercentage, aiPercentage } = req.body;
    if (sections) {
      ev.sections = sections;
      ev.totalScore = calcTotals(ev.sections);
    }
    if (generalComments !== undefined) ev.generalComments = generalComments;
    if (plagiarismPercentage !== undefined) ev.plagiarismPercentage = plagiarismPercentage;
    if (aiPercentage !== undefined) ev.aiPercentage = aiPercentage;
    await ev.save();
    res.json(ev);
  } catch (err) { next(err); }
};

exports.submitEvaluation = async (req, res, next) => {
  try {
    const ev = await Evaluation.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Evaluación no encontrada' });
    if (ev.status === 'submitted') return res.status(400).json({ message: 'Ya fue enviada' });
    if (ev.reviewerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Acceso denegado' });

    ev.status = 'submitted';
    ev.submittedAt = new Date();
    await ev.save();

    await updateProjectFinalScore(ev.projectId);
    res.json(ev);
  } catch (err) { next(err); }
};

async function updateProjectFinalScore(projectId) {
  const evals = await Evaluation.find({ projectId, status: 'submitted' });
  if (evals.length === 0) return;
  const avg = evals.reduce((s, e) => s + e.totalScore, 0) / evals.length;
  await Project.findByIdAndUpdate(projectId, {
    finalScore: Math.round(avg * 100) / 100,
    status: 'evaluated',
  });
}
