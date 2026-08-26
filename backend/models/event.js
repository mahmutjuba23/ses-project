'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Event.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    cover_image_path: DataTypes.STRING,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    category_id: DataTypes.INTEGER,
    period_id: DataTypes.INTEGER,
    status: DataTypes.STRING,
    cancel_reason: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Event',
  });
  return Event;
};