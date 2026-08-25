"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("applications", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      scholarship_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "scholarships",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      // pending | under_review | approved | rejected
      status: {
        type: Sequelize.ENUM("pending", "under_review", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },

      cover_letter: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      reviewer_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Prevent a user from applying to the same scholarship twice
    await queryInterface.addIndex("applications", ["user_id", "scholarship_id"], {
      unique: true,
      name: "unique_user_scholarship",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("applications");
  },
};
