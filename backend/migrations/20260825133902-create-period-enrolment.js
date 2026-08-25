'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PeriodEnrolments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      period_id: {
        type: Sequelize.INTEGER
      },
      student_id: {
        type: Sequelize.INTEGER
      },
      goal_points: {
        type: Sequelize.INTEGER
      },
      goal_override_reason: {
        type: Sequelize.STRING
      },
      collected_points: {
        type: Sequelize.INTEGER
      },
      adjustment_points: {
        type: Sequelize.INTEGER
      },
      percentage_reduction: {
        type: Sequelize.INTEGER
      },
      final_points: {
        type: Sequelize.INTEGER
      },
      result_status: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('PeriodEnrolments');
  }
};