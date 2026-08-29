'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('Students', {
      fields: ['student_number'],
      type: 'unique',
      name: 'unique_student_number'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Students', 'unique_student_number');
  }
};
