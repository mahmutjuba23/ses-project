"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Dynamically get the users (applicants & reviewers)
    const [applicants] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('applicant@ses.com', 'maria.garcia@ses.com')`
    );
    
    const [reviewers] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'reviewer@ses.com' LIMIT 1`
    );

    // Dynamically get the scholarships
    const [scholarships] = await queryInterface.sequelize.query(
      `SELECT id, title FROM scholarships WHERE title IN ('STEM Excellence Scholarship', 'Community Leadership Award', 'Need-Based Opportunity Grant')`
    );

    const userMap = {};
    applicants.forEach((u) => (userMap[u.email] = u.id));

    const reviewerId = reviewers.length ? reviewers[0].id : null;

    const scholarshipMap = {};
    scholarships.forEach((s) => (scholarshipMap[s.title] = s.id));

    const applicantId1 = userMap["applicant@ses.com"];
    const applicantId2 = userMap["maria.garcia@ses.com"];

    const stemId = scholarshipMap["STEM Excellence Scholarship"];
    const communityId = scholarshipMap["Community Leadership Award"];
    const needBasedId = scholarshipMap["Need-Based Opportunity Grant"];

    // Ensure we delete existing seeded applications based on user & scholarship combinations
    // (since it's a bit complex, we'll just delete all applications for these two demo applicants to stay idempotent)
    if (applicantId1 || applicantId2) {
      const applicantIds = [applicantId1, applicantId2].filter(Boolean);
      await queryInterface.bulkDelete("applications", {
        user_id: applicantIds,
      });
    }

    const applicationsToSeed = [];

    // Applicant 1 applies to STEM (Pending)
    if (applicantId1 && stemId) {
      applicationsToSeed.push({
        user_id: applicantId1,
        scholarship_id: stemId,
        status: "pending",
        cover_letter: "I am writing to express my strong interest in the STEM Excellence Scholarship. I have a 3.8 GPA in Computer Science and have been involved in numerous robotics projects...",
        reviewer_notes: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date(now.getTime() - 86400000 * 2), // 2 days ago
        updated_at: new Date(now.getTime() - 86400000 * 2),
      });
    }

    // Applicant 1 applies to Community Leadership (Approved)
    if (applicantId1 && communityId) {
      applicationsToSeed.push({
        user_id: applicantId1,
        scholarship_id: communityId,
        status: "approved",
        cover_letter: "I have volunteered over 200 hours at the local food bank and organized three community clean-ups. This scholarship would help me continue my community work while studying...",
        reviewer_notes: "Strong history of community service. Highly recommended for approval.",
        reviewed_by: reviewerId,
        reviewed_at: new Date(now.getTime() - 3600000 * 5), // 5 hours ago
        created_at: new Date(now.getTime() - 86400000 * 5), // 5 days ago
        updated_at: new Date(now.getTime() - 3600000 * 5),
      });
    }

    // Applicant 2 applies to Need-Based Grant (Under Review)
    if (applicantId2 && needBasedId) {
      applicationsToSeed.push({
        user_id: applicantId2,
        scholarship_id: needBasedId,
        status: "under_review",
        cover_letter: "Coming from a low-income household, financing my education has always been a challenge. This grant would significantly reduce the financial burden on my family...",
        reviewer_notes: "Needs to provide additional tax documentation for final verification.",
        reviewed_by: reviewerId,
        reviewed_at: new Date(now.getTime() - 86400000 * 1), // 1 day ago
        created_at: new Date(now.getTime() - 86400000 * 3), // 3 days ago
        updated_at: new Date(now.getTime() - 86400000 * 1),
      });
    }

    if (applicationsToSeed.length > 0) {
      await queryInterface.bulkInsert("applications", applicationsToSeed);
    }
  },

  async down(queryInterface) {
    const [applicants] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email IN ('applicant@ses.com', 'maria.garcia@ses.com')`
    );
    
    const applicantIds = applicants.map((a) => a.id);
    
    if (applicantIds.length > 0) {
      await queryInterface.bulkDelete("applications", {
        user_id: applicantIds,
      });
    }
  },
};
