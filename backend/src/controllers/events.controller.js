const { Event, EventCategory, Period } = require("../../models");
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
      error: req.query.error,
      warning: req.query.warning
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

module.exports = {
  listEvents,
  createEvent,
  publishEvent,
  finishEvent,
  cancelEvent
};
