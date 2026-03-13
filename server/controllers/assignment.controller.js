const Assignment = require('../models/Assignment');

exports.getAssignments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'reviewer') filter.reviewerId = req.user._id;
    if (req.query.contestId) filter.contestId = req.query.contestId;

    const assignments = await Assignment.find(filter)
      .populate('reviewerId', 'name email')
      .populate('contestId', 'name status')
      .populate('projectIds', 'title status finalScore')
      .sort('-createdAt');
    res.json(assignments);
  } catch (err) { next(err); }
};

exports.createAssignment = async (req, res, next) => {
  try {
    const { contestId, reviewerId, projectIds } = req.body;
    // Upsert: one assignment per reviewer per contest
    const assignment = await Assignment.findOneAndUpdate(
      { contestId, reviewerId },
      { projectIds, assignedBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(assignment);
  } catch (err) { next(err); }
};

exports.updateAssignment = async (req, res, next) => {
  try {
    const { projectIds } = req.body;
    const a = await Assignment.findByIdAndUpdate(req.params.id, { projectIds }, { new: true });
    if (!a) return res.status(404).json({ message: 'Asignación no encontrada' });
    res.json(a);
  } catch (err) { next(err); }
};

exports.deleteAssignment = async (req, res, next) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Asignación eliminada' });
  } catch (err) { next(err); }
};
