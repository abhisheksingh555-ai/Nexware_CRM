const multerExcel = require("../config/multerExcel");

/**
 * Single Excel file upload middleware
 * field name must be "excel"
 */
const uploadExcel = multerExcel.single("excel");

module.exports = uploadExcel;
