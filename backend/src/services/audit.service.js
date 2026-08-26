const { AuditLog } = require("../../models");

/**
 * Logs an action to the audit_logs table.
 * 
 * @param {Object} params
 * @param {number} params.actor_user_id - The ID of the user performing the action.
 * @param {string} params.entity - The entity being affected (e.g., 'User', 'Role').
 * @param {number} params.entity_id - The ID of the entity.
 * @param {string} params.action - The action being performed (e.g., 'ASSIGN_ROLE', 'REVOKE_ROLE').
 * @param {Object} [params.old_value] - Optional. The state of the entity before the action.
 * @param {Object} [params.new_value] - Optional. The state of the entity after the action.
 * @param {string} [params.reason] - Optional. The reason for the action.
 */
async function logAction({
  actor_user_id,
  entity,
  entity_id,
  action,
  old_value = null,
  new_value = null,
  reason = null,
}) {
  try {
    if (!actor_user_id) {
      console.warn(`[AuditLog] Skipped: no actor_user_id for action '${action}' on ${entity}:${entity_id}`);
      return;
    }
    await AuditLog.create({
      actor_user_id,
      entity,
      entity_id,
      action,
      old_value,
      new_value,
      reason,
    });
  } catch (error) {
    console.error("Failed to write to AuditLog:", error);
    // We intentionally don't throw the error so that the main business logic
    // doesn't fail just because the audit log failed to write, 
    // but in a strict system we might want to throw.
  }
}

module.exports = { logAction };
