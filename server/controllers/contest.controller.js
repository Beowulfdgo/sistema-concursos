const Contest = require('../models/Contest');

exports.getContests = async (req, res, next) => {
  try {
    const filter = {};
    // Students only see active contests open for registration
    if (req.user.role === 'student') {
      filter.status = 'active';
    }
    const contests = await Contest.find(filter)
      .populate('rubricId', 'name totalPoints')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json(contests);
  } catch (err) { next(err); }
};

exports.getContestById = async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('rubricId')
      .populate('createdBy', 'name email');
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado' });
    res.json(contest);
  } catch (err) { next(err); }
};

exports.createContest = async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, periodicity, rubricId, categories } = req.body;
    const contest = await Contest.create({
      name, description, startDate, endDate, periodicity,
      rubricId, categories: categories || [],
      createdBy: req.user._id,
    });
    res.status(201).json(contest);
  } catch (err) { next(err); }
};

exports.updateContest = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'startDate', 'endDate', 'periodicity', 'rubricId', 'categories'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const contest = await Contest.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('rubricId', 'name totalPoints');
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado' });
    res.json(contest);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft', 'active', 'closed', 'archived'].includes(status))
      return res.status(400).json({ message: 'Estado inválido' });
    const contest = await Contest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado' });
    res.json(contest);
  } catch (err) { next(err); }
};

exports.addCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      { $push: { categories: { name, description } } },
      { new: true }
    );
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado' });
    res.json(contest);
  } catch (err) { next(err); }
};

exports.removeCategory = async (req, res, next) => {
  try {
    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      { $pull: { categories: { _id: req.params.catId } } },
      { new: true }
    );
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado' });
    res.json(contest);
  } catch (err) { next(err); }
};
