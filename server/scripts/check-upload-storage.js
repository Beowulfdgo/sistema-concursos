#!/usr/bin/env node
/**
 * Script de verificación del almacenamiento de PDFs
 * 
 * Uso: node server/scripts/check-upload-storage.js
 * 
 * Verifica:
 * - Si UPLOAD_DIR está definida en variables de entorno
 * - Si el directorio existe y es accesible
 * - Cantidad y tamaño de archivos almacenados
 */

const path = require('path');
const fs = require('fs');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║          VERIFICACIÓN DE ALMACENAMIENTO DE PDFS              ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Mostrar variable de entorno
console.log('📋 VARIABLE DE ENTORNO:');
console.log('   UPLOAD_DIR:', process.env.UPLOAD_DIR || '(no definida)');

if (!process.env.UPLOAD_DIR || !process.env.UPLOAD_DIR.trim()) {
  console.log('\n⚠️  AVISO: UPLOAD_DIR no está definida.');
  console.log('   Se usará la ruta por defecto: server/uploads/projects\n');
}

// Resolver directorio
let uploadDir;
if (process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim()) {
  const dir = process.env.UPLOAD_DIR.trim();
  uploadDir = path.isAbsolute(dir) ? dir : path.resolve(__dirname, '..', dir);
} else {
  uploadDir = path.resolve(__dirname, '..', 'uploads', 'projects');
}

console.log('📂 RUTA RESUELTA:');
console.log('   ' + uploadDir);

// Verificar existencia
console.log('\n🔍 ESTADO DEL DIRECTORIO:');
const exists = fs.existsSync(uploadDir);
console.log('   Existe:', exists ? '✅ SÍ' : '❌ NO');

if (!exists) {
  console.log('\n⚠️  El directorio no existe. Se creará automáticamente en el primer upload.\n');
  process.exit(0);
}

// Verificar si es directorio
const isDir = fs.statSync(uploadDir).isDirectory();
console.log('   Es directorio:', isDir ? '✅ SÍ' : '❌ NO');

if (!isDir) {
  console.log('\n❌ ERROR: La ruta existe pero no es un directorio.\n');
  process.exit(1);
}

// Listar contenido
console.log('\n📄 CONTENIDO:');
try {
  const files = fs.readdirSync(uploadDir);
  
  if (files.length === 0) {
    console.log('   (vacío - sin archivos almacenados)\n');
  } else {
    console.log(`   Total de archivos: ${files.length}\n`);
    
    let totalSize = 0;
    files.forEach((file, index) => {
      const filePath = path.join(uploadDir, file);
      const stat = fs.statSync(filePath);
      const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
      totalSize += stat.size;
      
      const num = String(index + 1).padStart(2, '0');
      console.log(`   ${num}. ${file}`);
      console.log(`       Tamaño: ${sizeMB} MB`);
      console.log(`       Modificado: ${stat.mtime.toLocaleString('es-ES')}`);
    });
    
    const totalMB = (totalSize / 1024 / 1024).toFixed(2);
    console.log(`\n   📊 TOTAL: ${totalMB} MB en ${files.length} archivo(s)\n`);
  }
} catch (err) {
  console.log(`   ❌ Error al listar archivos: ${err.message}\n`);
  process.exit(1);
}

// Verificar permisos
console.log('🔐 PERMISOS:');
try {
  const stat = fs.statSync(uploadDir);
  const mode = stat.mode.toString(8).slice(-3);
  console.log(`   Modo: ${mode}`);
  console.log('   Lectura:', (stat.mode & 0o400) ? '✅ SÍ' : '❌ NO');
  console.log('   Escritura:', (stat.mode & 0o200) ? '✅ SÍ' : '❌ NO');
  console.log('   Ejecución:', (stat.mode & 0o100) ? '✅ SÍ' : '❌ NO');
} catch (err) {
  console.log(`   ⚠️  No se pudieron verificar permisos: ${err.message}`);
}

console.log('\n✅ Verificación completada.\n');
