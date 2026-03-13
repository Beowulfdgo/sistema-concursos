const Contest = require('../models/Contest');

exports.getContests = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'student') filter.status = 'active';
    const contests = await Contest.find(filter)
      .populate('rubricId', 'name totalPoints')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(contests);
  } catch (err) { next(err); }
};

exports.getContest = async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('rubricId')
      .populate('createdBy', 'name email');
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado.' });
    res.json(contest);
  } catch (err) { next(err); }
};

exports.createContest = async (req, res, next) => {
  try {
    const contest = await Contest.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(contest);
  } catch (err) { next(err); }
};

exports.updateContest = async (req, res, next) => {
  try {
    const contest = await Contest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado.' });
    res.json(contest);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const contest = await Contest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado.' });
    res.json({ message: `Estado actualizado a ${status}.`, contest });
  } catch (err) { next(err); }
};

exports.addCategory = async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado.' });
    contest.categories.push(req.body);
    await contest.save();
    res.status(201).json(contest);
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado.' });
    contest.categories = contest.categories.filter(c => c._id.toString() !== req.params.catId);
    await contest.save();
    res.json(contest);
  } catch (err) { next(err); }
};
