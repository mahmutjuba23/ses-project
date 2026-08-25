"use strict";

const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const salt = await bcrypt.genSalt(10);

    // Remove existing seeded users to avoid duplicate errors
    await queryInterface.bulkDelete("users", {
      email: [
        "admin@ses.com",
        "reviewer@ses.com",
        "applicant@ses.com",
        "maria.garcia@ses.com",
        "inactive@ses.com",
      ],
    });

    await queryInterface.bulkInsert("users", [
      {
        email: "admin@ses.com",
        full_name: "System Admin",
        password_hash: await bcrypt.hash("admin123", salt),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        email: "reviewer@ses.com",
        full_name: "Jane Reviewer",
        password_hash: await bcrypt.hash("reviewer123", salt),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        email: "applicant@ses.com",
        full_name: "John Applicant",
        password_hash: await bcrypt.hash("applicant123", salt),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        email: "maria.garcia@ses.com",
        full_name: "Maria Garcia",
        password_hash: await bcrypt.hash("maria123", salt),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        email: "inactive@ses.com",
        full_name: "Inactive User",
        password_hash: await bcrypt.hash("inactive123", salt),
        is_active: false,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      email: [
        "admin@ses.com",
        "reviewer@ses.com",
        "applicant@ses.com",
        "maria.garcia@ses.com",
        "inactive@ses.com",
      ],
    });
  },
};
