const { Student } = require('../models');

const faculties = [
  {
    name: 'Engineering',
    departments: [
      { name: 'Computer Science', programs: ['BSc Computer Science', 'MSc Computer Science'] },
      { name: 'Software Engineering', programs: ['BSc Software Engineering', 'MSc Software Engineering'] },
      { name: 'Electrical Engineering', programs: ['BSc Electrical Engineering'] },
    ]
  },
  {
    name: 'Business',
    departments: [
      { name: 'Finance', programs: ['BSc Finance', 'MSc Finance'] },
      { name: 'Marketing', programs: ['BSc Marketing'] },
      { name: 'Management', programs: ['BSc Business Management', 'MBA'] },
    ]
  },
  {
    name: 'Arts & Social Sciences',
    departments: [
      { name: 'Graphic Design', programs: ['BSc Graphic Design'] },
      { name: 'Communication', programs: ['BSc Communication Studies'] },
      { name: 'Psychology', programs: ['BSc Psychology', 'MSc Psychology'] },
    ]
  },
  {
    name: 'Law',
    departments: [
      { name: 'International Law', programs: ['LLB International Law', 'LLM International Law'] },
      { name: 'Business Law', programs: ['LLB Business Law'] },
    ]
  }
];

const studyLevels = ['Bachelor', 'Master'];
const scholarshipTypes = ['Full', 'Partial', 'None'];
const enrolmentYears = [2022, 2023, 2024, 2025];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  const students = await Student.findAll();
  console.log(`Found ${students.length} students to update.`);
  let updated = 0;
  for (const student of students) {
    const faculty = getRandom(faculties);
    const department = getRandom(faculty.departments);
    const program = getRandom(department.programs);
    const studyLevel = program.startsWith('MSc') || program.startsWith('MBA') || program.startsWith('LLM')
      ? 'Master' : 'Bachelor';
    const scholarshipType = getRandom(scholarshipTypes);
    const scholarshipPercentage = scholarshipType === 'Full' ? 100 : scholarshipType === 'Partial' ? getRandom([25, 50, 75]) : 0;

    await student.update({
      faculty: faculty.name,
      department: department.name,
      program,
      study_level: studyLevel,
      scholarship_type: scholarshipType,
      scholarship_percentage: scholarshipPercentage,
      enrolment_year: getRandom(enrolmentYears),
    });
    updated++;
  }
  console.log(`Successfully updated ${updated} students with academic data.`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
