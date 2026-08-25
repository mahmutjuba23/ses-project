'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Period extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Period.init({
    code: DataTypes.STRING,
    name: DataTypes.STRING,
    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,
    point_goal: DataTypes.INTEGER,
    status: DataTypes.STRING,
    scope_rule_json: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'Period',
  });
  return Period;
};