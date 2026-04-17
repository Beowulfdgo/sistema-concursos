require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Rubric = require('./models/Rubric');
const Contest = require('./models/Contest');
const Project = require('./models/Project');
const Evaluation = require('./models/Evaluation');
const Assignment = require('./models/Assignment');

async function inicializarTodo() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/concursos_db');

  await Promise.all([
    User.deleteMany({ role: { $in: ['admin', 'reviewer', 'student'] } }),
    Rubric.deleteMany({}),
    Contest.deleteMany({}),
    Project.deleteMany({}),
    Evaluation.deleteMany({}),
    Assignment.deleteMany({}),
  ]);

  console.log('Inicialización completa. Se han borrado usuarios (incluyendo revisores), rubricas, concursos, proyectos, evaluaciones y asignaciones.');
  await mongoose.disconnect();
}

inicializarTodo().catch((err) => {
  console.error('Error al inicializar datos:', err);
  process.exit(1);
});
