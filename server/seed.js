require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Rubric = require('./models/Rubric');
const Contest = require('./models/Contest');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/concursos_db');
  await Promise.all([User.deleteMany({}), Rubric.deleteMany({}), Contest.deleteMany({})]);
  const admin = await User.create({ name:'Administrador CNPPE', email:'admin@cnppe.mx', password:'admin1234', role:'admin', status:'active' });
  await User.create({ name:'Ernesto Valadez', email:'revisor@cnppe.mx', password:'revisor1234', role:'reviewer', status:'active' });
  await User.create({ name:'Alumno Demo', email:'alumno@cnppe.mx', password:'alumno1234', role:'student', status:'active' });
  await User.create({ name:'Alumno Demo 2', email:'alumno2@cnppe.mx', password:'alumno1234', role:'student', status:'active' }); 
  const rubricTec = await Rubric.create({
    name: 'Rubrica Tecnologico', description: 'Modalidad tecnologica', createdBy: admin._id,
    sections: [
      { title:'I. INFORME DEL PROTOTIPO', maxPoints:40, criteria:[
        {description:'Introduccion', minScore:0, maxScore:1},
        {description:'Planteamiento del problema', minScore:0, maxScore:1},
        {description:'Justificacion', minScore:0, maxScore:2},
        {description:'Hipotesis', minScore:0, maxScore:2},
        {description:'Objetivo', minScore:0, maxScore:4},
        {description:'Tipo de investigacion', minScore:0, maxScore:2},
        {description:'Marco Teorico', minScore:0, maxScore:2},
        {description:'Descripcion del desarrollo e implementacion', minScore:0, maxScore:4},
        {description:'Propuesta de valor', minScore:0, maxScore:4},
        {description:'Estudio de viabilidad', minScore:0, maxScore:2},
        {description:'Estudio de factibilidad tecnica y financiera', minScore:0, maxScore:4},
        {description:'Impacto social, ecologico, tecnologico', minScore:0, maxScore:4},
        {description:'Estrategia propiedad intelectual', minScore:0, maxScore:2},
        {description:'Analisis de resultados', minScore:0, maxScore:2},
        {description:'Conclusiones', minScore:0, maxScore:2},
        {description:'Bibliografia APA 7a edicion (min 10 refs)', minScore:0, maxScore:2},
      ]},
      { title:'II. MODALIDAD DEL PROTOTIPO', maxPoints:20, criteria:[
        {description:'Propone elementos tecnologicos innovadores', minScore:0, maxScore:5},
        {description:'Contribuye a mejorar el proceso para el cual fue disenado', minScore:0, maxScore:5},
        {description:'Aplica teorias y metodos con alto nivel de dominio', minScore:0, maxScore:5},
        {description:'Usa normas y estandares nacionales/internacionales', minScore:0, maxScore:5},
      ]},
      { title:'III. EXPOSICION ORAL, DOCUMENTOS Y MATERIALES', maxPoints:40, criteria:[
        {description:'Dominio verbal, corporal y facial en la exposicion', minScore:0, maxScore:5},
        {description:'Demuestra funcionamiento del prototipo', minScore:0, maxScore:5},
        {description:'Contextos de aplicacion del prototipo', minScore:0, maxScore:5},
        {description:'Detalla puntos clave de operacion', minScore:0, maxScore:5},
        {description:'Bitacora de actividades', minScore:0, maxScore:5},
        {description:'Cartel con todos los elementos requeridos', minScore:0, maxScore:5},
        {description:'Manuales de usuario/instalacion', minScore:0, maxScore:5},
        {description:'Materiales de exposicion utiles y claros', minScore:0, maxScore:5},
      ]},
    ]
  });

  await Contest.create({
    name:'Concurso Nacional de Prototipos XXVIII - Fase Estatal 2026',
    description:'CNPPE Edicion XXVIII, Anio 2026',
    startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'),
    periodicity:'annual', status:'active', rubricId: rubricTec._id,
    categories:[{name:'Mejora de procesos productivos, telecomunicaciones y electromovilidad'},{name:'Medio ambiente, energías renovables y sustentabilidad'},{name:'Educación, desarrollo social y sistemas económico-administrativos'},{name:'Biotecnología, innovación en alimentos y nutrición'}],
    createdBy: admin._id,
  });

  console.log('Seed OK - admin@cnppe.mx/admin1234 | revisor@cnppe.mx/revisor1234 | alumno@cnppe.mx/alumno1234 | alumno2@cnppe.mx/alumno1234');
  await mongoose.disconnect();
}
seed().catch(e=>{console.error(e);process.exit(1);});
