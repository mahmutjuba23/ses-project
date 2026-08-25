"use strict";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      full_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      tableName: "users",
      timestamps: false,
    }
  );
User.associate = (models) => {
    User.belongsToMany(models.Role, {
      through: models.UserRole,
      foreignKey: "user_id",
      otherKey: "role_id",
    });

    User.hasMany(models.Scholarship, {
      foreignKey: "created_by",
      as: "scholarships",
    });

    User.hasMany(models.Application, {
      foreignKey: "user_id",
      as: "applications",
    });

    User.hasMany(models.Application, {
      foreignKey: "reviewed_by",
      as: "reviewed_applications",
    });
  };

  return User;
};