"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Look up the actual IDs dynamically since users table uses auto-increment
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('admin@ses.com', 'reviewer@ses.com', 'applicant@ses.com', 'maria.garcia@ses.com', 'inactive@ses.com')`
    );

    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('admin', 'reviewer', 'applicant')`
    );

    const userMap = {};
    users.forEach((u) => (userMap[u.email] = u.id));

    const roleMap = {};
    roles.forEach((r) => (roleMap[r.name] = r.id));

    // Remove existing assignments for these users
    const userIds = Object.values(userMap);
    if (userIds.length > 0) {
      await queryInterface.bulkDelete("user_roles", {
        user_id: userIds,
      });
    }

    const assignments = [];

    if (userMap["admin@ses.com"] && roleMap["admin"]) {
      assignments.push({
        user_id: userMap["admin@ses.com"],
        role_id: roleMap["admin"],
        created_at: now,
        updated_at: now,
      });
    }

    if (userMap["reviewer@ses.com"] && roleMap["reviewer"]) {
      assignments.push({
        user_id: userMap["reviewer@ses.com"],
        role_id: roleMap["reviewer"],
        created_at: now,
        updated_at: now,
      });
    }

    if (userMap["applicant@ses.com"] && roleMap["applicant"]) {
      assignments.push({
        user_id: userMap["applicant@ses.com"],
        role_id: roleMap["applicant"],
        created_at: now,
        updated_at: now,
      });
    }

    if (userMap["maria.garcia@ses.com"] && roleMap["applicant"]) {
      assignments.push({
        user_id: userMap["maria.garcia@ses.com"],
        role_id: roleMap["applicant"],
        created_at: now,
        updated_at: now,
      });
    }

    if (userMap["inactive@ses.com"] && roleMap["applicant"]) {
      assignments.push({
        user_id: userMap["inactive@ses.com"],
        role_id: roleMap["applicant"],
        created_at: now,
        updated_at: now,
      });
    }

    if (assignments.length > 0) {
      await queryInterface.bulkInsert("user_roles", assignments);
    }
  },

  async down(queryInterface) {
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email IN ('admin@ses.com', 'reviewer@ses.com', 'applicant@ses.com', 'maria.garcia@ses.com', 'inactive@ses.com')`
    );

    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      await queryInterface.bulkDelete("user_roles", {
        user_id: userIds,
      });
    }
  },
};
