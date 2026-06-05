const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Resolver directorio de carga con prioridad a variable de entorno
const getUploadDir = () => {
  if (process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim()) {
    const dir = process.env.UPLOAD_DIR.trim();
    // Si es ruta absoluta, usarla directamente
    if (path.isAbsolute(dir)) {
      return dir;
    }
    // Si es relativa, resolverla desde server root
    return path.resolve(__dirname, '..', dir);
  }
  // Fallback a ruta relativa por defecto
  return path.resolve(__dirname, '..', 'uploads', 'projects');
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getUploadDir();
    console.log('[UPLOAD] Using directory:', uploadDir);
    
    // Crear directorio si no existe
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
});

// Middleware personalizado para loguear carga exitosa
upload.success = (req, res, next) => {
  if (req.file) {
    console.log('[UPLOAD] File saved:', req.file.filename, 'Path:', req.file.path);
  }
  next();
};

module.exports = upload;
