"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Remove existing seeded roles to avoid duplicate errors
    await queryInterface.bulkDelete("roles", {
      name: ["admin", "reviewer", "applicant"],
    });

    await queryInterface.bulkInsert("roles", [
      {
        id: 1,
        name: "admin",
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: "reviewer",
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        name: "applicant",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("roles", {
      name: ["admin", "reviewer", "applicant"],
    });
  },
};
