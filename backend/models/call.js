'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Call extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Call.init({
    event_id: DataTypes.INTEGER,
    task_type_id: DataTypes.INTEGER,
    quota: DataTypes.INTEGER,
    application_start: DataTypes.DATE,
    application_end: DataTypes.DATE,
    task_start: DataTypes.DATE,
    task_end: DataTypes.DATE,
    eligibility_rule_json: DataTypes.JSON,
    auto_approve: DataTypes.BOOLEAN,
    has_waitlist: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Call',
  });
  return Call;
};