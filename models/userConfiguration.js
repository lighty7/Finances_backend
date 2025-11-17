// models/userConfiguration.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UserConfiguration = sequelize.define(
    "user_configuration",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        comment: "Foreign key to users table",
      },
      totalEmi: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: null,
        comment: "Total EMI amount across all loans",
      },
      numberOfLoans: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
        comment: "Number of active loans",
      },
      emiSchedule: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
        comment: "Array of EMI schedule entries with date and amount",
      },
      loans: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
        comment:
          "Array of loan entries including bankName, loanType, principal, interestRate, startDate, currentBalance, notes",
      },
      income: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: null,
        comment: "Monthly income",
      },
      isConfigured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether the user has completed initial configuration",
      },
    },
    {
      timestamps: true,
      tableName: "user_configuration",
      indexes: [
        {
          fields: ["userId"],
          unique: true,
        },
      ],
    }
  );

  return UserConfiguration;
};

