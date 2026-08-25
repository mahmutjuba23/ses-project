"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Get the admin user's id dynamically
    const [admins] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@ses.com' LIMIT 1`
    );

    const createdBy = admins.length ? admins[0].id : null;

    // Remove existing seeded scholarships to stay idempotent
    await queryInterface.bulkDelete("scholarships", {
      title: [
        "STEM Excellence Scholarship",
        "Community Leadership Award",
        "Need-Based Opportunity Grant",
        "Arts & Humanities Scholarship",
        "Graduate Research Fellowship",
      ],
    });

    await queryInterface.bulkInsert("scholarships", [
      {
        title: "STEM Excellence Scholarship",
        description:
          "Awarded to outstanding students pursuing degrees in Science, Technology, Engineering, or Mathematics. Applicants must maintain a GPA of 3.5 or above.",
        amount: 5000.0,
        deadline: "2026-11-30",
        status: "open",
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      },
      {
        title: "Community Leadership Award",
        description:
          "Recognizes students who have demonstrated exceptional leadership in their communities through volunteer work, civic engagement, or social initiatives.",
        amount: 3000.0,
        deadline: "2026-10-15",
        status: "open",
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      },
      {
        title: "Need-Based Opportunity Grant",
        description:
          "Provides financial support to students from low-income backgrounds who show strong academic potential and a commitment to their education.",
        amount: 4500.0,
        deadline: "2026-12-01",
        status: "open",
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      },
      {
        title: "Arts & Humanities Scholarship",
        description:
          "Supports students excelling in literature, fine arts, history, philosophy, or related fields. A portfolio or writing sample is required.",
        amount: 2500.0,
        deadline: "2026-09-30",
        status: "closed",
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      },
      {
        title: "Graduate Research Fellowship",
        description:
          "Funding for graduate students undertaking original research projects. Priority given to proposals with measurable social impact.",
        amount: 8000.0,
        deadline: "2027-01-15",
        status: "draft",
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("scholarships", {
      title: [
        "STEM Excellence Scholarship",
        "Community Leadership Award",
        "Need-Based Opportunity Grant",
        "Arts & Humanities Scholarship",
        "Graduate Research Fellowship",
      ],
    });
  },
};
