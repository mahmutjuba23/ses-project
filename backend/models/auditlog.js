'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AuditLog.init({
    actor_user_id: DataTypes.INTEGER,
    entity: DataTypes.STRING,
    entity_id: DataTypes.INTEGER,
    action: DataTypes.STRING,
    old_value: DataTypes.JSON,
    new_value: DataTypes.JSON,
    reason: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'AuditLog',
  });
  return AuditLog;
};