const fs = require('fs');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const { Student, User } = require('../../models');

async function importStudents(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const students = [];

    if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => students.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json(sheet);
      students.push(...json);
    }

    // Process students logic here...
    let createdCount = 0;
    for (const s of students) {
      const [student, created] = await Student.upsert({
        student_number: s.student_number || s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        email: s.email,
        faculty: s.faculty,
        department: s.department,
        program: s.program,
        study_level: s.study_level,
        scholarship_type: s.scholarship_type,
        scholarship_percentage: s.scholarship_percentage || 0,
        enrolment_year: s.enrolment_year,
        is_active: true
      });
      if (created) createdCount++;
    }

    fs.unlinkSync(filePath); // clean up

    return res.status(200).json({ message: `Successfully processed file. Inserted/Updated ${students.length} students.` });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ message: 'Internal server error during import' });
  }
}

module.exports = { importStudents };
