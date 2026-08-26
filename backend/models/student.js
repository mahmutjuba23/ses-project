'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Student.belongsTo(models.User, { foreignKey: 'user_id' });
      Student.hasMany(models.PeriodEnrolment, { foreignKey: 'student_id' });
      Student.hasMany(models.CallApplication, { foreignKey: 'student_id' });
    }
  }
  Student.init({
    user_id: DataTypes.INTEGER,
    student_number: DataTypes.STRING,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: DataTypes.STRING,
    faculty: DataTypes.STRING,
    department: DataTypes.STRING,
    program: DataTypes.STRING,
    study_level: DataTypes.STRING,
    scholarship_type: DataTypes.STRING,
    scholarship_percentage: DataTypes.INTEGER,
    enrolment_year: DataTypes.INTEGER,
    is_active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Student',
  });
  return Student;
};