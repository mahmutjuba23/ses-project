const { Event, EventCategory, Period, Call, CallApplication, Student, User, TaskType } = require("../../models");
const { logAction } = require("../services/audit.service");
const { Op } = require("sequelize");

async function listEvents(req, res) {
  try {
    const events = await Event.findAll({
      include: [
        { model: EventCategory },
        { model: Period }
      ],
      order: [['start_date', 'DESC']]
    });

    const categories = await EventCategory.findAll({ where: { is_active: true } });

    res.render("admin/events", {
      title: "Manage Events — SES",
      currentPage: "admin-events",
      events,
      categories,
      user: req.user,
      error: req.query.error || null,
      pageWarning: req.query.warning || null
    });
  } catch (error) {
    console.error("List Events error:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function createEvent(req, res) {
  try {
    const { title, description, start_date, end_date, category_id } = req.body;
    
    // Find matching active period
    const period = await Period.findOne({
      where: {
        status: 'active',
        start_date: { [Op.lte]: start_date },
        end_date: { [Op.gte]: end_date }
      }
    });

    const newEvent = await Event.create({
      title,
      description,
      start_date,
      end_date,
      category_id,
      period_id: period ? period.id : null,
      status: "draft"
    });

    await logAction({
      actor_user_id: req.user ? req.user.id : 1,
      entity: "Event",
      entity_id: newEvent.id,
      action: "CREATE_EVENT",
      reason: "Admin created a new event"
    });

    if (!period) {
      return res.redirect("/admin/events?warning=no_period_match");
    }

    res.redirect("/admin/events");
  } catch (error) {
    console.error("Create Event error:", error);
    res.redirect("/admin/events?error=failed");
  }
}

async function updateEventStatus(req, res, newStatus, actionName) {
  try {
    const { event_id, cancel_reason } = req.body;
    const event = await Event.findByPk(event_id);
    
    if (!event) return res.redirect("/admin/events?error=not_found");

    event.status = newStatus;
    if (newStatus === 'cancelled') {
      event.cancel_reason = cancel_reason;
    }
    
    await event.save();

    await logAction({
      actor_user_id: req.user ? req.user.id : 1,
      entity: "Event",
      entity_id: event.id,
      action: actionName,
      reason: cancel_reason || `Admin changed event status to ${newStatus}`
    });

    res.redirect("/admin/events");
  } catch (error) {
    console.error(`Update Event Status (${newStatus}) error:`, error);
    res.redirect("/admin/events?error=failed");
  }
}

const publishEvent = (req, res) => updateEventStatus(req, res, 'published', 'PUBLISH_EVENT');
const finishEvent = (req, res) => updateEventStatus(req, res, 'finished', 'FINISH_EVENT');
const cancelEvent = (req, res) => updateEventStatus(req, res, 'cancelled', 'CANCEL_EVENT');

async function updateEvent(req, res) {
  try {
    const { event_id, title, description, start_date, end_date, category_id } = req.body;
    const event = await Event.findByPk(event_id);

    if (!event) return res.redirect("/admin/events?error=not_found");

    // Re-match to an active period based on new dates
    const period = await Period.findOne({
      where: {
        status: 'active',
        start_date: { [Op.lte]: start_date },
        end_date: { [Op.gte]: end_date }
      }
    });

    const oldValues = { title: event.title, description: event.description, start_date: event.start_date, end_date: event.end_date };

    await event.update({
      title,
      description,
      start_date,
      end_date,
      category_id,
      period_id: period ? period.id : event.period_id
    });

    await logAction({
      actor_user_id: req.user ? req.user.id : 1,
      entity: "Event",
      entity_id: event.id,
      action: "UPDATE_EVENT",
      old_value: oldValues,
      new_value: { title, description, start_date, end_date },
      reason: "Admin edited event details"
    });

    res.redirect("/admin/events");
  } catch (error) {
    console.error("Update Event error:", error);
    res.redirect("/admin/events?error=failed");
  }
}

async function viewEventDetails(req, res) {
  try {
    const { event_id } = req.params;
    const { call_id } = req.query;

    const event = await Event.findByPk(event_id, {
      include: [
        { model: EventCategory },
        { model: Period }
      ]
    });

    if (!event) return res.redirect("/admin/events?error=not_found");

    const calls = await Call.findAll({
      where: { event_id },
      include: [{ model: TaskType }],
      order: [['application_start', 'DESC']]
    });

    // If call_id is provided, filter by it. Otherwise get applications for all calls in this event.
    const callIds = call_id ? [call_id] : calls.map(c => c.id);

    const applications = await CallApplication.findAll({
      where: { call_id: callIds },
      include: [
        { model: Call, include: [{ model: TaskType }] },
        { model: Student, include: ['User'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const taskTypes = await TaskType.findAll({ where: { is_active: true } });

    res.render("admin/event-details", {
      title: `${event.title} — SES`,
      currentPage: "admin-events",
      event,
      calls,
      applications,
      taskTypes,
      selectedCallId: call_id || null,
      user: req.user,
      pageWarning: req.query.warning || null
    });
  } catch (error) {
    console.error("View Event Details error:", error);
    res.redirect("/admin/events?error=failed");
  }
}

module.exports = {
  listEvents,
  createEvent,
  updateEvent,
  publishEvent,
  finishEvent,
  cancelEvent,
  viewEventDetails
};
