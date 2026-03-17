const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Project = require('../models/Project');
const Evaluation = require('../models/Evaluation');
const Assignment = require('../models/Assignment');
const User = require('../models/User');

exports.adminDashboard = async (req, res, next) => {
  try {
    const [totalContests, activeContests, totalProjects, pendingEvals, totalStudents, totalReviewers] = await Promise.all([
      Contest.countDocuments(),
      Contest.countDocuments({ status: 'active' }),
      Project.countDocuments(),
      Evaluation.countDocuments({ status: 'draft' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'reviewer' }),
    ]);
    const recentProjects = await Project.find().sort('-createdAt').limit(5)
      .populate('representative', 'name').populate('contestId', 'name');
    res.json({ totalContests, activeContests, totalProjects, pendingEvals, totalStudents, totalReviewers, recentProjects });
  } catch (err) { next(err); }
};

exports.contestRankings = async (req, res, next) => {
  try {
    const { contestId } = req.params;
    const { categoryId } = req.query;
    const filter = { contestId, status: 'evaluated' };
    if (categoryId) filter.categoryId = categoryId;

    const projects = await Project.find(filter)
      .populate('representative', 'name email')
      .sort('-finalScore');
    res.json(projects);
  } catch (err) { next(err); }
};

exports.studentDashboard = async (req, res, next) => {
  try {
    const projects = await Project.find({ representative: req.user._id })
      .populate('contestId', 'name status startDate endDate');
    res.json({ projects });
  } catch (err) { next(err); }
};

exports.reviewerDashboard = async (req, res, next) => {
  try {
    // Usar el mismo criterio que en GET /assignments (reviewerId = req.user._id)
    const reviewerId = req.user._id;
    const assignments = await Assignment.find({ reviewerId })
      .populate('contestId', 'name status startDate endDate')
      .populate('projectIds', 'title status finalScore');

    const evaluations = await Evaluation.find({ reviewerId });
    const submittedIds = new Set(evaluations.filter(e => e.status === 'submitted').map(e => (e.projectId && e.projectId.toString()) || ''));

    const toProjectId = (p) => (p && (p._id || p).toString()) || '';
    const summary = assignments.map(a => {
      const ids = (a.projectIds || []);
      return {
        contest: a.contestId,
        totalProjects: ids.length,
        evaluated: ids.filter(p => submittedIds.has(toProjectId(p))).length,
        pending: ids.filter(p => !submittedIds.has(toProjectId(p))).length,
        projects: ids,
      };
    });

    res.json({ summary });
  } catch (err) { next(err); }
};
