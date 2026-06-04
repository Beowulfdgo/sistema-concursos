const PDFDocument = require('pdfkit');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const Project = require('../models/Project');
const Evaluation = require('../models/Evaluation');

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es-ES');
  } catch {
    return String(value);
  }
};

const sanitizeFilename = (value) => {
  if (!value) return 'exportacion_proyecto';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
};

const formatDateTime = (dateValue) => {
  const date = new Date(dateValue || new Date());
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const buildProjectInfoText = (project, evaluations) => {
  const statusMap = { submitted: 'Enviado', under_review: 'En revisión', evaluated: 'Evaluado' };
  const teamNames = (project.teamMembers || []).map(m => m.name).filter(Boolean);
  if (teamNames.length === 0 && project.representative?.name) {
    teamNames.push(project.representative.name);
  }

  let text = '';
  text += '=================================================\n';
  text += 'INFORMACIÓN GENERAL DEL PROYECTO\n';
  text += '=================================================\n\n';
  text += `Proyecto:\n${project.title || '—'}\n\n`;
  text += `Número de registro:\n${project.registrationNumber || '—'}\n\n`;
  text += `Concurso:\n${project.contestId?.name || '—'}\n\n`;
  text += `Categoría:\n${project.categoryName || 'Sin categoría'}\n\n`;
  text += `Estado:\n${statusMap[project.status] || project.status || '—'}\n\n`;
  text += `Calificación Final:\n${project.finalScore != null ? project.finalScore.toFixed(3) : 'Pendiente'}\n\n`;
  text += '=================================================\n';
  text += 'VIDEO DEL PROYECTO\n';
  text += '=================================================\n\n';
  text += `${project.youtubeUrl || '—'}\n\n`;
  text += '=================================================\n';
  text += 'INTEGRANTES\n';
  text += '=================================================\n\n';
  text += teamNames.length > 0 ? teamNames.join('\n\n') : 'No hay integrantes registrados';
  text += '\n\n';
  text += '=================================================\n';
  text += 'FECHA DE EXPORTACIÓN\n';
  text += '=================================================\n\n';
  text += `${formatDateTime(new Date())}\n\n`;

  const feedbacks = evaluations.filter(ev => ev.generalComments && ev.generalComments.trim());
  if (feedbacks.length > 0) {
    text += '=================================================\n';
    text += 'RETROALIMENTACIÓN GENERAL\n';
    text += '=================================================\n\n';
    feedbacks.forEach((ev, index) => {
      const label = `Dictamen ${String.fromCharCode(65 + index)}`;
      text += `${label}\n\n${ev.generalComments.trim()}\n\n`;
      if (index < feedbacks.length - 1) {
        text += '-------------------------------------------------\n\n';
      }
    });
    text += '\n';
  }

  return text;
};

const ensureSpace = (doc, neededLines = 5) => {
  const remaining = doc.page.height - doc.y - doc.page.margins.bottom;
  const estimated = neededLines * 14;
  if (remaining < estimated) doc.addPage();
};

const addLabelValue = (doc, label, value) => {
  doc.font('Helvetica-Bold').fontSize(10).text(`${label}: `, { continued: true });
  doc.font('Helvetica').fontSize(10).text(value || '—');
};

const addSection = (doc, title) => {
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(12).text(title);
  doc.moveDown(0.2);
};

const addCriterion = (doc, criterion) => {
  const scoreText = criterion.score != null ? Number(criterion.score).toFixed(2) : 'Pendiente';
  doc.font('Helvetica-Bold').fontSize(10).text(`• ${criterion.description}`);
  doc.font('Helvetica').fontSize(10).text(`  Puntuación: ${scoreText} / ${criterion.maxScore ?? '—'}`);
  if (criterion.comment) {
    doc.font('Helvetica').fontSize(10).text(`  Comentario: ${criterion.comment}`);
  }
  doc.moveDown(0.2);
};

exports.generateEvaluationPdf = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate('representative', 'name institution')
    .populate('contestId', 'name edition')
    .lean();

  if (!project) throw new Error('Proyecto no encontrado.');

  const evaluations = await Evaluation.find({ projectId }).lean();
  const submittedEvals = evaluations.filter(ev => ev.status === 'submitted');
  const draftsCount = evaluations.filter(ev => ev.status !== 'submitted').length;

  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));

  doc.font('Helvetica-Bold').fontSize(18).text('Evaluación Consolidada', { align: 'center' });
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(10).text(`Generado: ${formatDate(new Date())}`, { align: 'center' });
  doc.moveDown(1);

  addSection(doc, 'Datos del Proyecto');
  addLabelValue(doc, 'Título', project.title);
  addLabelValue(doc, 'Youtube URL', project.youtubeUrl || '—');
  addLabelValue(doc, 'Concursos', project.contestId?.name || '—');
  addLabelValue(doc, 'Edición', project.contestId?.edition || '—');
  addLabelValue(doc, 'Categoría', project.categoryName || 'Sin categoría');
  addLabelValue(doc, 'Número de registro', project.registrationNumber || '—');
  addLabelValue(doc, 'Estado del proyecto', project.status || '—');
  addLabelValue(doc, 'Calificación final', project.finalScore != null ? project.finalScore.toFixed(2) : 'Pendiente');
  addSection(doc, 'Equipo');
  addLabelValue(doc, 'Representante', project.representative?.name || '—');
  addLabelValue(doc, 'Institución', project.representative?.institution || '—');
  const teamNames = (project.teamMembers || []).map(member => member.name).filter(Boolean);
  if (teamNames.length > 0) {
    addLabelValue(doc, 'Integrantes', teamNames.join(', '));
  }

  addSection(doc, 'Resumen de evaluaciones');
  addLabelValue(doc, 'Evaluaciones enviadas', `${submittedEvals.length}`);
  addLabelValue(doc, 'Evaluaciones en borrador', `${draftsCount}`);

  if (draftsCount > 0) {
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9).fillColor('red').text('Advertencia: hay evaluaciones en borrador que no se incluyen en este documento.', { align: 'left' });
    doc.fillColor('black');
  }

  if (submittedEvals.length === 0) {
    ensureSpace(doc, 6);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).text('No hay evaluaciones enviadas disponibles para este proyecto.', { align: 'left' });
    doc.end();
    await new Promise((resolve, reject) => doc.on('end', resolve).on('error', reject));
    return Buffer.concat(chunks);
  }

  submittedEvals.forEach((evalItem, index) => {
    ensureSpace(doc, 8);
    addSection(doc, `Evaluación Anónima ${index + 1}`);
    addLabelValue(doc, 'Estado', evalItem.status || '—');
    addLabelValue(doc, 'Total', evalItem.totalScore != null ? Number(evalItem.totalScore).toFixed(2) : 'Pendiente');
    addLabelValue(doc, 'Fecha de envío', formatDate(evalItem.submittedAt));
    addLabelValue(doc, 'Plagio (%)', evalItem.plagiarismPercentage != null ? `${evalItem.plagiarismPercentage}%` : 'No informado');
    addLabelValue(doc, 'AI (%)', evalItem.aiPercentage != null ? `${evalItem.aiPercentage}%` : 'No informado');

    if (evalItem.generalComments) {
      doc.moveDown(0.2);
      doc.font('Helvetica-Bold').fontSize(10).text('Comentarios generales:');
      doc.font('Helvetica').fontSize(10).text(evalItem.generalComments, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
    }

    if (evalItem.sections && evalItem.sections.length > 0) {
      evalItem.sections.forEach((section) => {
        ensureSpace(doc, 6);
        doc.font('Helvetica-Bold').fontSize(11).text(`${section.title} (${section.sectionTotal != null ? Number(section.sectionTotal).toFixed(2) : '0'} / ${section.maxPoints ?? '—'})`);
        if (section.criteria && section.criteria.length > 0) {
          section.criteria.forEach((criterion) => addCriterion(doc, criterion));
        }
      });
    }

    if (index < submittedEvals.length - 1) {
      doc.moveDown(0.5);
      doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
      doc.moveDown(0.5);
    }
  });

  doc.end();
  await new Promise((resolve, reject) => doc.on('end', resolve).on('error', reject));
  return Buffer.concat(chunks);
};

exports.generateProjectZip = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate('representative', 'name institution')
    .populate('contestId', 'name edition')
    .lean();

  if (!project) throw new Error('Proyecto no encontrado.');

  console.log('[EXPORT] Proyecto encontrado');
  const submittedEvals = await Evaluation.find({ projectId, status: 'submitted' }).lean();
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('warning', err => {
    if (err.code === 'ENOENT') {
      console.warn('[EXPORT]', err.message);
    } else {
      throw err;
    }
  });
  archive.on('error', err => {
    throw err;
  });

  const originalPath = project.filePath ? path.join(__dirname, '..', project.filePath) : null;
  if (originalPath && fs.existsSync(originalPath)) {
    archive.file(originalPath, { name: 'proyecto.pdf' });
    console.log('[EXPORT] PDF original agregado');
  } else {
    archive.append('El archivo PDF original del proyecto no fue encontrado en el sistema.', { name: 'proyecto_no_disponible.txt' });
  }

  const evaluationPdf = await exports.generateEvaluationPdf(projectId);
  archive.append(evaluationPdf, { name: 'evaluacion_consolidada.pdf' });
  console.log('[EXPORT] PDF consolidado generado');

  const infoText = buildProjectInfoText(project, submittedEvals);
  archive.append(infoText, { name: 'informacion_proyecto.txt' });

  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const filename = `${sanitizeFilename(project.title)}_${timestamp}.zip`;

  return { archive, filename };
};
