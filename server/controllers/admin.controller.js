const exportService = require('../services/export.service');

exports.exportProjectZip = async (req, res, next) => {
  try {
    const { archive, filename } = await exportService.generateProjectZip(req.params.projectId);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    archive.on('error', (err) => next(err));
    archive.pipe(res);
    await archive.finalize();
  } catch (err) {
    next(err);
  }
};
