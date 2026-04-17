const fs = require('fs');
const path = require('path');
const Project = require('../models/Project');
const Assignment = require('../models/Assignment');

exports.getProjects = async (req, res, next) => {
  try {
    const { contestId, status } = req.query;
    let filter = {};
    if (contestId) filter.contestId = contestId;
    if (status) filter.status = status;

    if (req.user.role === 'student') {
      filter.representative = req.user.id;
    } else if (req.user.role === 'reviewer') {
      const assignments = await Assignment.find({ reviewerId: req.user.id });
      const projectIds = assignments.flatMap(a => a.projectIds);
      filter._id = { $in: projectIds };
      if (contestId) filter.contestId = contestId;
    }

    const projects = await Project.find(filter)
      .populate('representative', 'name email')
      .populate('contestId', 'name status')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { next(err); }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('representative', 'name email')
      .populate('contestId', 'name rubricId');
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado.' });
    res.json(project);
  } catch (err) { next(err); }
};

exports.createProject = async (req, res, next) => {
  try {
    const { title, contestId, categoryId, categoryName, teamMembers } = req.body;
    const existingProject = await Project.findOne({ representative: req.user.id, contestId });
    if (existingProject) return res.status(400).json({ message: 'Ya tienes un proyecto registrado en este concurso.' });

    // Parse team members from request body
    let members = [];
    if (teamMembers) {
      members = typeof teamMembers === 'string' ? JSON.parse(teamMembers) : teamMembers;
    }

    // Add the logged-in user as representative in team members
    const representativeMember = {
      name: req.user.name,
      email: req.user.email,
      isRepresentative: true
    };

    // Check if representative is already in the list, if not, add at the beginning
    const existingRepIndex = members.findIndex(m => m.email === req.user.email);
    if (existingRepIndex === -1) {
      members.unshift(representativeMember);
    } else {
      // If already exists, ensure isRepresentative is true
      members[existingRepIndex].isRepresentative = true;
    }

    const projectData = {
      title, contestId, categoryId, categoryName,
      representative: req.user.id,
      teamMembers: members,
    };

    if (req.file) {
      projectData.filePath = req.file.path.replace(/\\/g, '/');
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
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado.' });
    if (req.user.role === 'student' && project.representative.toString() !== req.user.id)
      return res.status(403).json({ message: 'No tienes permiso para editar este proyecto.' });

    Object.assign(project, req.body);
    if (req.file) {
      // Delete old file
      if (project.filePath && fs.existsSync(project.filePath)) fs.unlinkSync(project.filePath);
      project.filePath = req.file.path.replace(/\\/g, '/');
      project.fileName = req.file.originalname;
      project.fileSize = req.file.size;
    }
    await project.save();
    res.json(project);
  } catch (err) { next(err); }
};

exports.getProjectFile = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project?.filePath) return res.status(404).json({ message: 'Archivo no encontrado.' });

    const filePath = path.resolve(project.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Archivo no encontrado en el servidor.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${project.fileName || 'proyecto.pdf'}"`);
    res.sendFile(filePath);
  } catch (err) { next(err); }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado.' });
    if (project.filePath && fs.existsSync(project.filePath)) fs.unlinkSync(project.filePath);
    await project.deleteOne();
    res.json({ message: 'Proyecto eliminado.' });
  } catch (err) { next(err); }
};
