const User = require('../models/User');
const Contest = require('../models/Contest');
const Project = require('../models/Project');
const Evaluation = require('../models/Evaluation');
const Assignment = require('../models/Assignment');

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const [totalContests, activeContests, totalProjects, pendingEvals, totalUsers, totalStudents, totalReviewers, recentProjects] = await Promise.all([
      Contest.countDocuments(),
      Contest.countDocuments({ status: 'active' }),
      Project.countDocuments(),
      Evaluation.countDocuments({ status: 'draft' }),
      User.countDocuments({ role: { $in: ['student', 'reviewer'] } }),
      User.countDocuments({ role: 'student', status: 'active' }),
      User.countDocuments({ role: 'reviewer', status: 'active' }),
      Project.find().sort({ createdAt: -1 }).limit(5).populate('representative', 'name').populate('contestId', 'name'),
    ]);
    res.json({ totalContests, activeContests, totalProjects, pendingEvals, totalUsers, totalStudents, totalReviewers, recentProjects });
  } catch (err) { next(err); }
};

exports.getContestRanking = async (req, res, next) => {
  try {
    const { contestId } = req.params;
    const { categoryId } = req.query;
    const filter = { contestId, status: 'evaluated' };
    if (categoryId) filter.categoryId = categoryId;

    const projects = await Project.find(filter)
      .populate('representative', 'name email institution')
      .sort({ finalScore: -1 });
    res.json(projects);
  } catch (err) { next(err); }
};

exports.getStudentDashboard = async (req, res, next) => {
  try {
    const projects = await Project.find({ representative: req.user.id })
      .populate('contestId', 'name status startDate endDate');
    res.json({ projects });
  } catch (err) { next(err); }
};

exports.getReviewerDashboard = async (req, res, next) => {
  try {
    const reviewerId = req.user._id || req.user.id;

    const assignments = await Assignment.find({ reviewerId })
      .populate('contestId', 'name status startDate endDate')
      .populate('projectIds', 'title registrationNumber status finalScore');

    // Para cada proyecto buscar la evaluación del revisor actual
    const enrichedAssignments = await Promise.all(
      assignments.map(async (a) => {
        const obj = a.toObject();
        obj.projects = await Promise.all(
          obj.projectIds.map(async (p) => {
            const myEval = await Evaluation.findOne({
              projectId: p._id,
              reviewerId
            }).select('status totalScore _id submittedAt');
            return { ...p, myEvaluation: myEval || null };
          })
        );
        return obj;
      })
    );

    const stats = { totalAssigned: 0, evaluated: 0, pending: 0 };
    enrichedAssignments.forEach(a => {
      a.projects.forEach(p => {
        stats.totalAssigned++;
        if (p.myEvaluation?.status === 'submitted') stats.evaluated++;
        else stats.pending++;
      });
    });

    res.json({ assignments: enrichedAssignments, stats });
  } catch (err) { next(err); }
};

exports.getContestRankingGrouped = async (req, res, next) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId).lean();
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado' });

    // Traer todos los proyectos del concurso con equipo
    const projects = await Project.find({ contestId })
      .populate('representative', 'name email')
      .sort({ finalScore: -1 })
      .lean();

    // Agrupar por categoría
    const categoryMap = {};

    // Inicializar categorías del concurso en orden
    (contest.categories || []).forEach(cat => {
      categoryMap[cat._id.toString()] = {
        categoryId: cat._id,
        categoryName: cat.name,
        projects: []
      };
    });

    // Categoría sin asignar
    categoryMap['sin_categoria'] = {
      categoryId: null,
      categoryName: 'Sin categoría',
      projects: []
    };

    projects.forEach(p => {
      const key = p.categoryId ? p.categoryId.toString() : 'sin_categoria';
      if (!categoryMap[key]) {
        categoryMap[key] = {
          categoryId: p.categoryId,
          categoryName: p.categoryName || 'Sin categoría',
          projects: []
        };
      }
      categoryMap[key].projects.push({
        projectId: p._id,
        title: p.title,
        registrationNumber: p.registrationNumber,
        finalScore: p.finalScore ?? null,
        status: p.status,
        teamMembers: p.teamMembers || [],
        representative: p.representative
      });
    });

    // Filtrar categorías vacías y ordenar proyectos por score desc
    const categories = Object.values(categoryMap)
      .filter(c => c.projects.length > 0)
      .map(c => ({
        ...c,
        projects: c.projects.sort((a, b) => (b.finalScore ?? -1) - (a.finalScore ?? -1))
      }));

    res.json({
      contestId: contest._id,
      contestName: contest.name,
      categories
    });
  } catch (err) { next(err); }
};

exports.exportContestExcel = async (req, res, next) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId).lean();
    if (!contest) return res.status(404).json({ message: 'Concurso no encontrado' });

    const projects = await Project.find({ contestId })
      .populate('representative', 'name email')
      .sort({ categoryName: 1, finalScore: -1 })
      .lean();

    // Construir CSV
    const rows = [
      ['Categoría', 'Nombre del Proyecto', 'No. Registro', 'Alumnos Participantes', 'Calificación Final']
    ];

    projects.forEach(p => {
      const categoria = p.categoryName || 'Sin categoría';
      const alumnos = (p.teamMembers || []).map(m => m.name).join('; ') || p.representative?.name || '—';
      const score = p.finalScore != null ? p.finalScore.toFixed(2) : 'Pendiente';
      rows.push([categoria, p.title, p.registrationNumber || '—', alumnos, score]);
    });

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const filename = `calificaciones_${contest.name.replace(/\s+/g, '_')}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM para Excel
  } catch (err) { next(err); }
};

exports.exportActiveReviewersExcel = async (req, res, next) => {
  try {
    const assignments = await Assignment.find()
      .populate({ path: 'contestId', select: 'name startDate endDate status' })
      .populate({ path: 'reviewerId', select: 'name status' })
      .lean();

    const rows = [
      ['Nombre del concurso', 'Nombre del juez', 'Fecha de inicio', 'Fecha final del concurso']
    ];

    assignments
      .filter(a => a.contestId && a.reviewerId && a.reviewerId.status === 'active' && a.contestId.status === 'active')
      .sort((a, b) => {
        if (a.contestId.name < b.contestId.name) return -1;
        if (a.contestId.name > b.contestId.name) return 1;
        return a.reviewerId.name.localeCompare(b.reviewerId.name);
      })
      .forEach(a => {
        const startDate = a.contestId.startDate ? new Date(a.contestId.startDate).toLocaleDateString('es-MX') : '';
        const endDate = a.contestId.endDate ? new Date(a.contestId.endDate).toLocaleDateString('es-MX') : '';
        rows.push([a.contestId.name, a.reviewerId.name, startDate, endDate]);
      });

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const filename = `jueces_activos_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (err) { next(err); }
};

exports.exportActiveStudentsExcel = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate('contestId', 'name startDate endDate')
      .populate('representative', 'name role status')
      .lean();

    const rows = [
      ['Nombre del concurso', 'Nombre del proyecto', 'Nombre del alumno', 'Fecha de inicio', 'Fecha final del concurso']
    ];

    projects
      .filter(p => p.representative?.role === 'student' && p.representative?.status === 'active' && p.contestId)
      .sort((a, b) => {
        if (a.contestId.name < b.contestId.name) return -1;
        if (a.contestId.name > b.contestId.name) return 1;
        return a.representative.name.localeCompare(b.representative.name);
      })
      .forEach(p => {
        const startDate = p.contestId.startDate ? new Date(p.contestId.startDate).toLocaleDateString('es-MX') : '';
        const endDate = p.contestId.endDate ? new Date(p.contestId.endDate).toLocaleDateString('es-MX') : '';
        rows.push([p.contestId.name, p.title || '—', p.representative.name, startDate, endDate]);
      });

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const filename = `alumnos_activos_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (err) { next(err); }
};