'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CallApplication extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CallApplication.belongsTo(models.Call, { foreignKey: 'call_id' });
      CallApplication.belongsTo(models.Student, { foreignKey: 'student_id' });
    }
  }
  CallApplication.init({
    call_id: DataTypes.INTEGER,
    student_id: DataTypes.INTEGER,
    status: DataTypes.STRING,
    qr_code_token: DataTypes.STRING,
    points_awarded: DataTypes.INTEGER,
    reviewer_notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'CallApplication',
  });
  return CallApplication;
};