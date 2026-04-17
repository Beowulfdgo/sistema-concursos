require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Rubric = require('./models/Rubric');
const Contest = require('./models/Contest');
const Project = require('./models/Project');
const Evaluation = require('./models/Evaluation');
const Assignment = require('./models/Assignment');

// Importar la función seed
const { seed } = require('./seed');

async function inicializarTodo() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/concursos_db');

  // Primero borrar todos los datos
  await Promise.all([
    User.deleteMany({ role: { $in: ['admin', 'reviewer', 'student'] } }),
    Rubric.deleteMany({}),
    Contest.deleteMany({}),
    Project.deleteMany({}),
    Evaluation.deleteMany({}),
    Assignment.deleteMany({}),
  ]);

  console.log('✅ Datos eliminados exitosamente.');

  // Luego ejecutar el seed para cargar datos de prueba
  console.log('🌱 Cargando datos de prueba...');
  await seed();

  console.log('🎉 Inicialización completa. Base de datos limpia y datos de prueba cargados.');
  await mongoose.disconnect();
}

inicializarTodo().catch((err) => {
  console.error('Error al inicializar datos:', err);
  process.exit(1);
});
