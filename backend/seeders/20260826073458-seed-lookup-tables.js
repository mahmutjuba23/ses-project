'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // EventCategories
    await queryInterface.bulkInsert("eventcategories", [
      { name: "Academic Conferences", is_active: true, created_at: now, updated_at: now },
      { name: "Student Clubs", is_active: true, created_at: now, updated_at: now },
      { name: "Departmental Support", is_active: true, created_at: now, updated_at: now },
      { name: "University Promotion", is_active: true, created_at: now, updated_at: now },
    ]);

    // TaskTypes
    await queryInterface.bulkInsert("tasktypes", [
      { name: "Ushering / Registration", is_active: true, created_at: now, updated_at: now },
      { name: "Lab Assistance", is_active: true, created_at: now, updated_at: now },
      { name: "Event Setup / Teardown", is_active: true, created_at: now, updated_at: now },
      { name: "Campus Tour Guide", is_active: true, created_at: now, updated_at: now },
      { name: "Social Media / Photography", is_active: true, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("eventcategories", null, {});
    await queryInterface.bulkDelete("tasktypes", null, {});
  }
};
