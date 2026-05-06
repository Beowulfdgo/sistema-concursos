const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Contest = require('../models/Contest');
const Assignment = require('../models/Assignment');

function normalizeStoredPath(p) {
  if (!p || typeof p !== 'string') return null;
  return p.replace(/\\/g, '/').trim();
}

function resolveProjectFilePath(storedPath) {
  const normalized = normalizeStoredPath(storedPath);
  if (!normalized) return null;

  if (path.isAbsolute(normalized) && fs.existsSync(normalized)) return normalized;

  const serverRoot = path.resolve(__dirname, '..');
  const rel = normalized.replace(/^\/+/, '');
  const candidateFromServerRoot = path.resolve(serverRoot, rel);
  if (fs.existsSync(candidateFromServerRoot)) return candidateFromServerRoot;

  const base = path.basename(rel);
  const candidateUploads = path.resolve(serverRoot, 'uploads', 'projects', base);
  if (fs.existsSync(candidateUploads)) return candidateUploads;

  return null;
}


function extractYoutubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }
      const m = parsed.pathname.match(/^\/(embed|shorts)\/([A-Za-z0-9_-]{11})/);
      if (m?.[2]) return m[2];
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeYoutubeUrl(url) {
  const id = extractYoutubeVideoId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}


exports.getProjects = async (req, res, next) => {
  try {
    const { contestId } = req.query;
    let filter = {};
    if (contestId) filter.contestId = contestId;

    if (req.user.role === 'student') {
      filter.representative = req.user._id;
    } else if (req.user.role === 'reviewer') {
      const reviewerId = new mongoose.Types.ObjectId(req.user._id.toString());
      const assignmentFilter = { reviewerId };
      if (contestId) assignmentFilter.contestId = new mongoose.Types.ObjectId(contestId);
      const assignments = await Assignment.find(assignmentFilter);
      const projectIds = assignments.flatMap(a => (a.projectIds || []).map(id => id._id || id));
      if (projectIds.length === 0) filter._id = { $in: [] };
      else filter._id = { $in: projectIds };
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
    const { title, contestId, categoryId, categoryName, teamMembers, youtubeUrl } = req.body;
    const members = typeof teamMembers === 'string' ? JSON.parse(teamMembers) : teamMembers;

    if (!youtubeUrl) return res.status(400).json({ message: 'La URL de video de YouTube es requerida.' });
    const normalizedYoutubeUrl = normalizeYoutubeUrl(youtubeUrl);
    if (!normalizedYoutubeUrl) {
      return res.status(400).json({
        message: 'URL de YouTube inválida. Formatos: https://www.youtube.com/watch?v=VIDEO_ID, https://youtu.be/VIDEO_ID, https://www.youtube.com/embed/VIDEO_ID, https://www.youtube.com/shorts/VIDEO_ID',
      });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado' });
    if (!contest.isOpen) return res.status(400).json({ message: 'El concurso no está abierto para inscripciones' });

    // Check student hasn't already submitted to this contest
    const existing = await Project.findOne({ contestId, representative: req.user._id });
    if (existing) return res.status(409).json({ message: 'Ya tienes un proyecto en este concurso' });

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
      youtubeUrl: normalizedYoutubeUrl,
      representative: req.user._id,
      teamMembers: members || [],
    };

    if (req.file) {
      const serverRoot = path.resolve(__dirname, '..');
      projectData.filePath = path.relative(serverRoot, req.file.path).replace(/\\/g, '/');
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
    const filePath = resolveProjectFilePath(project.filePath);
    if (!filePath) return res.status(404).json({ message: 'Archivo no encontrado' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${project.fileName || 'proyecto.pdf'}"`);
    res.sendFile(filePath);
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
