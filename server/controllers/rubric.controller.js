const Rubric = require('../models/Rubric');

exports.getRubrics = async (req, res, next) => {
  try {
    const rubrics = await Rubric.find().populate('createdBy', 'name email').sort('-createdAt');
    res.json(rubrics);
  } catch (err) { next(err); }
};

exports.getRubricById = async (req, res, next) => {
  try {
    const rubric = await Rubric.findById(req.params.id).populate('createdBy', 'name email');
    if (!rubric) return res.status(404).json({ message: 'Rúbrica no encontrada' });
    res.json(rubric);
  } catch (err) { next(err); }
};

exports.createRubric = async (req, res, next) => {
  try {
    const { name, description, sections } = req.body;
    const rubric = await Rubric.create({ name, description, sections: sections || [], createdBy: req.user._id });
    res.status(201).json(rubric);
  } catch (err) { next(err); }
};

exports.updateRubric = async (req, res, next) => {
  try {
    const { name, description, sections } = req.body;
    const rubric = await Rubric.findById(req.params.id);
    if (!rubric) return res.status(404).json({ message: 'Rúbrica no encontrada' });
    if (name !== undefined) rubric.name = name;
    if (description !== undefined) rubric.description = description;
    if (sections !== undefined) rubric.sections = sections;
    await rubric.save(); // triggers pre-save totalPoints calc
    res.json(rubric);
  } catch (err) { next(err); }
};

exports.deleteRubric = async (req, res, next) => {
  try {
    const Contest = require('../models/Contest');
    const inUse = await Contest.findOne({ rubricId: req.params.id });
    if (inUse) return res.status(409).json({ message: 'La rúbrica está asignada a uno o más concursos' });
    await Rubric.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rúbrica eliminada' });
  } catch (err) { next(err); }
};
