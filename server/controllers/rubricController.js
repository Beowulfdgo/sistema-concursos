const Rubric = require('../models/Rubric');
const Contest = require('../models/Contest');

exports.getRubrics = async (req, res, next) => {
  try {
    const rubrics = await Rubric.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json(rubrics);
  } catch (err) { next(err); }
};

exports.getRubric = async (req, res, next) => {
  try {
    const rubric = await Rubric.findById(req.params.id).populate('createdBy', 'name email');
    if (!rubric) return res.status(404).json({ message: 'Rúbrica no encontrada.' });
    res.json(rubric);
  } catch (err) { next(err); }
};

exports.createRubric = async (req, res, next) => {
  try {
    const rubric = await Rubric.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(rubric);
  } catch (err) { next(err); }
};

exports.updateRubric = async (req, res, next) => {
  try {
    const rubric = await Rubric.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rubric) return res.status(404).json({ message: 'Rúbrica no encontrada.' });
    // Recalculate totalPoints
    rubric.totalPoints = rubric.sections.reduce((sum, s) => sum + s.maxPoints, 0);
    await rubric.save();
    res.json(rubric);
  } catch (err) { next(err); }
};

exports.deleteRubric = async (req, res, next) => {
  try {
    const inUse = await Contest.findOne({ rubricId: req.params.id });
    if (inUse) return res.status(400).json({ message: 'No se puede eliminar: la rúbrica está asignada a un concurso.' });
    const rubric = await Rubric.findByIdAndDelete(req.params.id);
    if (!rubric) return res.status(404).json({ message: 'Rúbrica no encontrada.' });
    res.json({ message: 'Rúbrica eliminada.' });
  } catch (err) { next(err); }
};
