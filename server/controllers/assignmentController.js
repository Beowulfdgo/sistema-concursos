const Assignment = require('../models/Assignment');

exports.getAssignments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'reviewer') filter.reviewerId = req.user.id;
    if (req.query.contestId) filter.contestId = req.query.contestId;

    const assignments = await Assignment.find(filter)
      .populate('reviewerId', 'name email')
      .populate('projectIds', req.user.role === 'reviewer' ? 'title registrationNumber status' : 'title registrationNumber status finalScore')
      .populate('contestId', 'name status');
    res.json(assignments);
  } catch (err) { next(err); }
};

exports.createAssignment = async (req, res, next) => {
  try {
    const { contestId, reviewerId, projectIds } = req.body;
    let assignment = await Assignment.findOne({ contestId, reviewerId });
    if (assignment) {
      assignment.projectIds = [...new Set([...assignment.projectIds.map(String), ...projectIds])];
      await assignment.save();
    } else {
      assignment = await Assignment.create({ contestId, reviewerId, projectIds, assignedBy: req.user.id });
    }
    const populated = await assignment.populate(['reviewerId', 'projectIds', 'contestId']);
    res.status(201).json(populated);
  } catch (err) { next(err); }
};

exports.updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada.' });
    res.json(assignment);
  } catch (err) { next(err); }
};

exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada.' });
    res.json({ message: 'Asignación eliminada.' });
  } catch (err) { next(err); }
};
