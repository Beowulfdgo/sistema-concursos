const User = require('../models/User');
const Contest = require('../models/Contest');
const Project = require('../models/Project');
const Evaluation = require('../models/Evaluation');
const Assignment = require('../models/Assignment');

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const [totalContests, activeContests, totalProjects, pendingEvals, totalUsers, recentProjects] = await Promise.all([
      Contest.countDocuments(),
      Contest.countDocuments({ status: 'active' }),
      Project.countDocuments(),
      Evaluation.countDocuments({ status: 'draft' }),
      User.countDocuments({ role: { $in: ['student', 'reviewer'] } }),
      Project.find().sort({ createdAt: -1 }).limit(5).populate('representative', 'name').populate('contestId', 'name'),
    ]);
    res.json({ totalContests, activeContests, totalProjects, pendingEvals, totalUsers, recentProjects });
  } catch (err) { next(err); }
};

exports.getContestRanking = async (req, res, next) => {
  try {
    const { contestId } = req.params;
    const { categoryId } = req.query;
    const filter = { contestId, status: 'evaluated' };
    if (categoryId) filter.categoryId = categoryId;

    const projects = await Project.find(filter)
      .populate('representative', 'name email institution')
      .sort({ finalScore: -1 });
    res.json(projects);
  } catch (err) { next(err); }
};

exports.getStudentDashboard = async (req, res, next) => {
  try {
    const projects = await Project.find({ representative: req.user.id })
      .populate('contestId', 'name status startDate endDate');
    res.json({ projects });
  } catch (err) { next(err); }
};

exports.getReviewerDashboard = async (req, res, next) => {
  try {
    const reviewerId = req.user._id || req.user.id;

    const assignments = await Assignment.find({ reviewerId })
      .populate('contestId', 'name status startDate endDate')
      .populate('projectIds', 'title registrationNumber status finalScore');

    // Para cada proyecto buscar la evaluación del revisor actual
    const enrichedAssignments = await Promise.all(
      assignments.map(async (a) => {
        const obj = a.toObject();
        obj.projects = await Promise.all(
          obj.projectIds.map(async (p) => {
            const myEval = await Evaluation.findOne({
              projectId: p._id,
              reviewerId
            }).select('status totalScore _id submittedAt');
            return { ...p, myEvaluation: myEval || null };
          })
        );
        return obj;
      })
    );

    const stats = { totalAssigned: 0, evaluated: 0, pending: 0 };
    enrichedAssignments.forEach(a => {
      a.projects.forEach(p => {
        stats.totalAssigned++;
        if (p.myEvaluation?.status === 'submitted') stats.evaluated++;
        else stats.pending++;
      });
    });

    res.json({ assignments: enrichedAssignments, stats });
  } catch (err) { next(err); }
};
