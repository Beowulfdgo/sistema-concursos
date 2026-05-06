Todos los cambios importantes de este proyecto serán documentados en este archivo.

El formato está basado en Keep a Changelog y este proyecto sigue versionado semántico (SemVer).
[1.0.0] - 2026-04-20
Added
Versión inicial del sistema
Estructura base del proyecto
Configuración inicial en Railway
Implementación básica de autenticación
[1.1.0] - 2026-04-29
Added
Envío de correos mediante servicio Resend
Registro de usuarios con notificación por email
Configuración de Dockerfile para despliegue
Fixed
Corrección en importación de AuthContext en AuthPages.js
Changed
Ajustes en configuración de staging para despliegue continuo
[Unreleased]
Added

- Validación de URL de YouTube por extracción de `videoId` (11 caracteres) y soporte de formatos:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`
  - `https://www.youtube.com/shorts/VIDEO_ID`
- Normalización de `youtubeUrl` a formato canónico `https://www.youtube.com/watch?v=VIDEO_ID` al registrar proyectos.
- Soporte de configuración de almacenamiento de PDFs vía `UPLOAD_DIR` (para volúmenes persistentes en Railway u otras plataformas).


Fixed

- Corrección/robustez en recuperación de PDF (`GET /api/v1/projects/:id/file`) resolviendo rutas guardadas en BD (Windows/Linux, absolutas/relativas) para reducir falsos 404.


Changed

- Unificación de `UPLOAD_DIR` en el middleware de carga (Multer) para que todas las subidas respeten la misma variable de entorno.