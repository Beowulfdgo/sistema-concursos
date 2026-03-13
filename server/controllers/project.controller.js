const path = require('path');
const fs = require('fs');
const Project = require('../models/Project');
const Contest = require('../models/Contest');
const Assignment = require('../models/Assignment');

exports.getProjects = async (req, res, next) => {
  try {
    const { contestId } = req.query;
    let filter = {};
    if (contestId) filter.contestId = contestId;

    if (req.user.role === 'student') {
      filter.representative = req.user._id;
    } else if (req.user.role === 'reviewer') {
      // Only assigned projects
      const assignments = await Assignment.find({ reviewerId: req.user._id, ...(contestId ? { contestId } : {}) });
      const projectIds = assignments.flatMap(a => a.projectIds);
      filter._id = { $in: projectIds };
    }

    const projects = await Project.find(filter)
      .populate('representative', 'name email')
      .populate('contestId', 'name')
      .sort('-createdAt');
    res.json(projects);
  } catch (err) { next(err); }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('representative', 'name email')
      .populate('contestId', 'name rubricId');
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });

    // Students can only see their own
    if (req.user.role === 'student' && project.representative._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Acceso denegado' });

    res.json(project);
  } catch (err) { next(err); }
};

exports.createProject = async (req, res, next) => {
  try {
    const { title, contestId, categoryId, categoryName, teamMembers } = req.body;
    const members = typeof teamMembers === 'string' ? JSON.parse(teamMembers) : teamMembers;

    const contest = await Contest.findById(contestId);
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado' });
    if (!contest.isOpen) return res.status(400).json({ message: 'El concurso no está abierto para inscripciones' });

    // Check student hasn't already submitted to this contest
    const existing = await Project.findOne({ contestId, representative: req.user._id });
    if (existing) return res.status(409).json({ message: 'Ya tienes un proyecto en este concurso' });

    const projectData = {
      title, contestId, categoryId, categoryName,
      representative: req.user._id,
      teamMembers: members || [],
    };

    if (req.file) {
      projectData.filePath = req.file.path;
      projectData.fileName = req.file.originalname;
      projectData.fileSize = req.file.size;
    }

    const project = await Project.create(projectData);
    res.status(201).json(project);
  } catch (err) { next(err); }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });
    if (req.user.role === 'student' && project.representative.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Acceso denegado' });

    const allowed = ['title', 'teamMembers', 'categoryId', 'categoryName'];
    allowed.forEach(k => { if (req.body[k] !== undefined) project[k] = req.body[k]; });
    await project.save();
    res.json(project);
  } catch (err) { next(err); }
};

exports.getProjectFile = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });
    if (req.user.role === 'student' && project.representative.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Acceso denegado' });
    if (!project.filePath || !fs.existsSync(project.filePath))
      return res.status(404).json({ message: 'Archivo no encontrado' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${project.fileName || 'proyecto.pdf'}"`);
    res.sendFile(path.resolve(project.filePath));
  } catch (err) { next(err); }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });
    if (project.filePath && fs.existsSync(project.filePath))
      fs.unlinkSync(project.filePath);
    res.json({ message: 'Proyecto eliminado' });
  } catch (err) { next(err); }
};
