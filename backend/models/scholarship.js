"use strict";

module.exports = (sequelize, DataTypes) => {
  const Scholarship = sequelize.define(
    "Scholarship",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      deadline: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("draft", "open", "closed"),
        allowNull: false,
        defaultValue: "draft",
      },

      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      tableName: "scholarships",
      timestamps: false,
    }
  );

  Scholarship.associate = (models) => {
    Scholarship.belongsTo(models.User, {
      foreignKey: "created_by",
      as: "creator",
    });
  };

  return Scholarship;
};
