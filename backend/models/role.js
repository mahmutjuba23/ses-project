"use strict";

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

     created_at: {
  type: DataTypes.DATE,
  allowNull: false,
  defaultValue: DataTypes.NOW,
},

updated_at: {
  type: DataTypes.DATE,
  allowNull: false,
  defaultValue: DataTypes.NOW,
},
    },
    {
      tableName: "roles",
      timestamps: false,
    }
  );

  Role.associate = (models) => {
    Role.belongsToMany(models.User, {
  through: {
    model: "user_roles",
    timestamps: false,
  },
  foreignKey: "role_id",
  otherKey: "user_id",
});
  };

  return Role;
};