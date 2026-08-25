'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PeriodEnrolment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PeriodEnrolment.init({
    period_id: DataTypes.INTEGER,
    student_id: DataTypes.INTEGER,
    goal_points: DataTypes.INTEGER,
    goal_override_reason: DataTypes.STRING,
    collected_points: DataTypes.INTEGER,
    adjustment_points: DataTypes.INTEGER,
    percentage_reduction: DataTypes.INTEGER,
    final_points: DataTypes.INTEGER,
    result_status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'PeriodEnrolment',
  });
  return PeriodEnrolment;
};