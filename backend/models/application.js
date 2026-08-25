"use strict";

module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define(
    "Application",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      scholarship_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("pending", "under_review", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },

      cover_letter: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      resume_file: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      reviewer_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      reviewed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      reviewed_at: {
        type: DataTypes.DATE,
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
      tableName: "applications",
      timestamps: false,
    }
  );

  Application.associate = (models) => {
    Application.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "applicant",
    });

    Application.belongsTo(models.Scholarship, {
      foreignKey: "scholarship_id",
      as: "scholarship",
    });

    Application.belongsTo(models.User, {
      foreignKey: "reviewed_by",
      as: "reviewer",
    });
  };

  return Application;
};
