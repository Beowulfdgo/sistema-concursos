import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Alert, Card } from '../../components/common/UI';
import api from '../../api/axios';

const EvaluateProject = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [rubric, setRubric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load project details (without finalScore for reviewers)
      const projectRes = await api.get(`/projects/${projectId}`);
      setProject(projectRes.data);

      // Load rubric
      const rubricRes = await api.get(`/rubrics/${projectRes.data.contestId}`);
      setRubric(rubricRes.data);

      // Load reviewer's evaluation
      const evalRes = await api.get(`/evaluations/project/${projectId}`);
      if (evalRes.data.length > 0) {
        setEvaluation(evalRes.data[0]); // Only one per reviewer
      } else {
        // Initialize empty evaluation
        setEvaluation({
          sections: rubricRes.data.sections.map(section => ({
            sectionId: section._id,
            title: section.title,
            maxPoints: section.maxPoints,
            criteria: section.criteria.map(criterion => ({
              criterionId: criterion._id,
              description: criterion.description,
              score: 0,
              minScore: criterion.minScore,
              maxScore: criterion.maxScore,
              comment: ''
            })),
            sectionTotal: 0
          })),
          generalComments: '',
          plagiarismPercentage: '',
          aiPercentage: '',
          status: 'draft'
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError('');
      const data = {
        projectId,
        sections: evaluation.sections,
        generalComments: evaluation.generalComments,
        plagiarismPercentage: evaluation.plagiarismPercentage,
        aiPercentage: evaluation.aiPercentage,
        status: 'draft'
      };
      const res = await api.post('/evaluations', data);
      setEvaluation(res.data);
      setSuccess('Borrador guardado exitosamente');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar borrador');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');
      const data = {
        projectId,
        sections: evaluation.sections,
        generalComments: evaluation.generalComments,
        plagiarismPercentage: evaluation.plagiarismPercentage,
        aiPercentage: evaluation.aiPercentage,
        status: 'submitted'
      };
      const res = await api.post('/evaluations', data);
      setEvaluation(res.data);
      setSuccess('Evaluación enviada exitosamente');
      navigate('/reviewer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar evaluación');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (sectionIndex, updates) => {
    const newSections = [...evaluation.sections];
    newSections[sectionIndex] = { ...newSections[sectionIndex], ...updates };
    // Recalculate section total
    const criteria = newSections[sectionIndex].criteria;
    newSections[sectionIndex].sectionTotal = criteria.reduce((sum, c) => sum + (parseFloat(c.score) || 0), 0);
    setEvaluation({ ...evaluation, sections: newSections });
  };

  const updateCriterion = (sectionIndex, criterionIndex, updates) => {
    const newSections = [...evaluation.sections];
    newSections[sectionIndex].criteria[criterionIndex] = {
      ...newSections[sectionIndex].criteria[criterionIndex],
      ...updates
    };
    updateSection(sectionIndex, { criteria: newSections[sectionIndex].criteria });
  };

  if (loading) return <div>Cargando...</div>;
  if (!project || !rubric) return <div>No se pudo cargar el proyecto</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Evaluar Proyecto: {project.title}</h1>
      <p>Número de Registro: {project.registrationNumber}</p>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <Card>
        <h2>Rúbrica de Evaluación</h2>
        {evaluation.sections.map((section, sectionIndex) => (
          <div key={section.sectionId} style={{ marginBottom: 20 }}>
            <h3>{section.title} (Máximo: {section.maxPoints} puntos)</h3>
            {section.criteria.map((criterion, criterionIndex) => (
              <div key={criterion.criterionId} style={{ marginBottom: 10, padding: 10, border: '1px solid #ddd' }}>
                <p>{criterion.description}</p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <label>Puntuación ({criterion.minScore}-{criterion.maxScore}):</label>
                  <Input
                    type="number"
                    min={criterion.minScore}
                    max={criterion.maxScore}
                    value={criterion.score}
                    onChange={(e) => updateCriterion(sectionIndex, criterionIndex, { score: parseFloat(e.target.value) || 0 })}
                    style={{ width: 80 }}
                  />
                  <label>Comentario:</label>
                  <Input
                    value={criterion.comment}
                    onChange={(e) => updateCriterion(sectionIndex, criterionIndex, { comment: e.target.value })}
                    placeholder="Comentario opcional"
                  />
                </div>
              </div>
            ))}
            <p><strong>Total de la sección: {section.sectionTotal.toFixed(2)}</strong></p>
          </div>
        ))}
        <div style={{ marginTop: 20 }}>
          <h3>Comentarios Generales</h3>
          <textarea
            value={evaluation.generalComments}
            onChange={(e) => setEvaluation({ ...evaluation, generalComments: e.target.value })}
            rows={4}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            placeholder="Comentarios generales sobre el proyecto"
          />
        </div>
        <div style={{ marginTop: 20 }}>
          <label>Porcentaje de Plagio:</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={evaluation.plagiarismPercentage}
            onChange={(e) => setEvaluation({ ...evaluation, plagiarismPercentage: e.target.value })}
            style={{ width: 100 }}
          /> %
        </div>
        <div style={{ marginTop: 10 }}>
          <label>Porcentaje de IA:</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={evaluation.aiPercentage}
            onChange={(e) => setEvaluation({ ...evaluation, aiPercentage: e.target.value })}
            style={{ width: 100 }}
          /> %
        </div>
      </Card>

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <Button onClick={handleSaveDraft} disabled={saving} variant="secondary">
          💾 Guardar Borrador
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          📤 Enviar Evaluación
        </Button>
      </div>
    </div>
  );
};

export default EvaluateProject;