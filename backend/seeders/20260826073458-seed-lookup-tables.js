'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // EventCategories
    await queryInterface.bulkInsert("EventCategories", [
      { name: "Academic Conferences", is_active: true, createdAt: now, updatedAt: now },
      { name: "Student Clubs", is_active: true, createdAt: now, updatedAt: now },
      { name: "Departmental Support", is_active: true, createdAt: now, updatedAt: now },
      { name: "University Promotion", is_active: true, createdAt: now, updatedAt: now },
    ]);

    // TaskTypes
    await queryInterface.bulkInsert("TaskTypes", [
      { name: "Ushering / Registration", is_active: true, createdAt: now, updatedAt: now },
      { name: "Lab Assistance", is_active: true, createdAt: now, updatedAt: now },
      { name: "Event Setup / Teardown", is_active: true, createdAt: now, updatedAt: now },
      { name: "Campus Tour Guide", is_active: true, createdAt: now, updatedAt: now },
      { name: "Social Media / Photography", is_active: true, createdAt: now, updatedAt: now },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("EventCategories", null, {});
    await queryInterface.bulkDelete("TaskTypes", null, {});
  }
};
