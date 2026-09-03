const { 
  sequelize, Period, Event, Call, CallApplication, PeriodEnrolment, TaskType, Student
} = require('../models');

async function resetAndSeed() {
  const transaction = await sequelize.transaction();
  try {
    console.log("🔥 Destroying all existing test data...");
    await CallApplication.destroy({ where: {}, transaction });
    await Call.destroy({ where: {}, transaction });
    await Event.destroy({ where: {}, transaction });
    await PeriodEnrolment.destroy({ where: {}, transaction });
    await TaskType.destroy({ where: {}, transaction });
    await Period.destroy({ where: {}, transaction });

    console.log("🌱 Creating EXHAUSTIVE Golden State test data...");

    // 1. Create Task Types
    const ttVolunteering = await TaskType.create({ name: 'Volunteering', is_active: true }, { transaction });
    const ttWorkshop = await TaskType.create({ name: 'Workshop', is_active: true }, { transaction });
    const ttMentoring = await TaskType.create({ name: 'Mentoring', is_active: true }, { transaction });
    const ttLogistics = await TaskType.create({ name: 'Logistics/Setup', is_active: true }, { transaction });
    
    // 2. Create Periods (Draft, Active, Closed)
    const draftPeriod = await Period.create({
      code: 'SPR2027', name: 'Spring 2027 (DRAFT)', start_date: new Date('2027-03-01'), end_date: new Date('2027-06-30'), point_goal: 300, status: 'draft'
    }, { transaction });

    const activePeriod = await Period.create({
      code: 'FALL2026', name: 'Fall 2026 (ACTIVE)', start_date: new Date('2026-09-01'), end_date: new Date('2026-12-31'), point_goal: 250, status: 'active'
    }, { transaction });

    const closedPeriod = await Period.create({
      code: 'SPR2026', name: 'Spring 2026 (CLOSED)', start_date: new Date('2026-03-01'), end_date: new Date('2026-06-30'), point_goal: 200, status: 'closed'
    }, { transaction });

    const allStudents = await Student.findAll({ where: { is_active: true }, transaction });
    
    // --- ENROLLMENTS ---
    // Active Period: Enrol everyone. We will manipulate some goals to test OVERRIDES.
    const activeEnrolments = allStudents.map((student, idx) => {
      let goal = 250;
      let reason = null;
      if (idx === 0) { goal = 150; reason = "Medical exemption"; } // Edge case: Goal Override
      return {
        period_id: activePeriod.id, student_id: student.id, goal_points: goal, goal_override_reason: reason, collected_points: 0, result_status: null
      };
    });
    await PeriodEnrolment.bulkCreate(activeEnrolments, { transaction });

    // Closed Period: Explicit PASS and FAIL cases
    const closedEnrolments = [];
    closedEnrolments.push({ period_id: closedPeriod.id, student_id: allStudents[1].id, goal_points: 200, collected_points: 250, result_status: 'PASS' }); // Overachiever
    closedEnrolments.push({ period_id: closedPeriod.id, student_id: allStudents[2].id, goal_points: 200, collected_points: 200, result_status: 'PASS' }); // Exact match
    closedEnrolments.push({ period_id: closedPeriod.id, student_id: allStudents[3].id, goal_points: 200, collected_points: 150, result_status: 'FAIL' }); // Tried but failed
    closedEnrolments.push({ period_id: closedPeriod.id, student_id: allStudents[4].id, goal_points: 200, collected_points: 0, result_status: 'FAIL' }); // No show
    await PeriodEnrolment.bulkCreate(closedEnrolments, { transaction });


    // --- EVENTS & CALLS (Exhaustive Scenarios) ---
    console.log("📅 Generating Exhaustive Events and Calls...");
    
    // EVENT 1: Multiple Calls, Waitlists, Auto-approve vs Manual
    const eventMulti = await Event.create({
      period_id: activePeriod.id, title: 'Mega Tech Conference 2026', description: 'Testing multiple calls inside one event.',
      date: new Date('2026-11-10'), location: 'Main Hall', is_active: true
    }, { transaction });
    
    const callMulti_A = await Call.create({
      event_id: eventMulti.id, task_type_id: ttLogistics.id, quota: 2, // Tiny quota to test waitlist
      application_start: new Date('2026-10-01'), application_end: new Date('2026-11-09'),
      task_start: new Date('2026-11-10T07:00:00'), task_end: new Date('2026-11-10T12:00:00'),
      auto_approve: true, has_waitlist: true
    }, { transaction });

    const callMulti_B = await Call.create({
      event_id: eventMulti.id, task_type_id: ttMentoring.id, quota: 10,
      application_start: new Date('2026-10-01'), application_end: new Date('2026-11-09'),
      task_start: new Date('2026-11-10T13:00:00'), task_end: new Date('2026-11-10T16:00:00'),
      auto_approve: false, has_waitlist: false // Manual approval required
    }, { transaction });


    // EVENT 2: Eligibility Rules (Only Engineering)
    const eventRestricted = await Event.create({
      period_id: activePeriod.id, title: 'Engineering Alumni Mixer', description: 'Restricted event.',
      date: new Date('2026-10-25'), location: 'Engineering Block', is_active: true
    }, { transaction });

    const callRestricted = await Call.create({
      event_id: eventRestricted.id, task_type_id: ttVolunteering.id, quota: 5,
      application_start: new Date('2026-10-01'), application_end: new Date('2026-10-24'),
      task_start: new Date('2026-10-25T18:00:00'), task_end: new Date('2026-10-25T21:00:00'),
      auto_approve: true, has_waitlist: true,
      eligibility_rule_json: { faculty: "Engineering" } // Specific rule
    }, { transaction });

    // EVENT 3: Empty Event (No Calls yet)
    await Event.create({
      period_id: activePeriod.id, title: 'Empty Future Event', description: 'Created but no calls added yet.',
      date: new Date('2026-12-01'), location: 'TBD', is_active: true
    }, { transaction });


    // --- APPLICATIONS SIMULATION ---
    console.log("📝 Simulating Application Edge Cases...");
    
    // Mega Conference - Logistics Call (Testing Quota & Waitlist)
    // Quota is 2. We will apply 4 students. Auto-approve is true.
    await CallApplication.create({ call_id: callMulti_A.id, student_id: allStudents[5].id, status: 'approved' }, { transaction }); // Spot 1
    await CallApplication.create({ call_id: callMulti_A.id, student_id: allStudents[6].id, status: 'approved' }, { transaction }); // Spot 2
    await CallApplication.create({ call_id: callMulti_A.id, student_id: allStudents[7].id, status: 'waitlisted' }, { transaction }); // Waitlist 1
    await CallApplication.create({ call_id: callMulti_A.id, student_id: allStudents[8].id, status: 'waitlisted' }, { transaction }); // Waitlist 2

    // Mega Conference - Mentoring Call (Testing Manual Approval States)
    await CallApplication.create({ call_id: callMulti_B.id, student_id: allStudents[9].id, status: 'pending' }, { transaction });
    await CallApplication.create({ call_id: callMulti_B.id, student_id: allStudents[10].id, status: 'pending' }, { transaction });
    await CallApplication.create({ call_id: callMulti_B.id, student_id: allStudents[11].id, status: 'approved' }, { transaction });
    await CallApplication.create({ call_id: callMulti_B.id, student_id: allStudents[12].id, status: 'rejected' }, { transaction }); // Admin rejected

    // Engineering Alumni Mixer (Testing Attended & Points)
    // We will simulate that the event happened and points were awarded.
    await CallApplication.create({ call_id: callRestricted.id, student_id: allStudents[13].id, status: 'attended', points_awarded: 50 }, { transaction });
    await CallApplication.create({ call_id: callRestricted.id, student_id: allStudents[14].id, status: 'attended', points_awarded: 100 }, { transaction }); // Bonus points given manually
    await CallApplication.create({ call_id: callRestricted.id, student_id: allStudents[15].id, status: 'approved' }, { transaction }); // Approved but didn't show up yet / not graded

    // Apply the points to their active period enrolment
    await PeriodEnrolment.increment('collected_points', { by: 50, where: { period_id: activePeriod.id, student_id: allStudents[13].id }, transaction });
    await PeriodEnrolment.increment('collected_points', { by: 100, where: { period_id: activePeriod.id, student_id: allStudents[14].id }, transaction });

    await transaction.commit();
    console.log("✅ Exhaustive Golden State database reset successfully!");
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  }
}

resetAndSeed();
