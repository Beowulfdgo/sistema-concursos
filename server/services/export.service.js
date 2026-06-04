const PDFDocument = require('pdfkit');
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
