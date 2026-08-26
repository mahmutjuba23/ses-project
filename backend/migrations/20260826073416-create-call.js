'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Calls', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      event_id: {
        type: Sequelize.INTEGER
      },
      task_type_id: {
        type: Sequelize.INTEGER
      },
      quota: {
        type: Sequelize.INTEGER
      },
      application_start: {
        type: Sequelize.DATE
      },
      application_end: {
        type: Sequelize.DATE
      },
      task_start: {
        type: Sequelize.DATE
      },
      task_end: {
        type: Sequelize.DATE
      },
      eligibility_rule_json: {
        type: Sequelize.JSON
      },
      auto_approve: {
        type: Sequelize.BOOLEAN
      },
      has_waitlist: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Calls');
  }
};