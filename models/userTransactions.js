const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UserTransaction = sequelize.define(
    "user_transactions",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      type: {
        type: DataTypes.ENUM("INCOME", "EXPENSE"),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      transactionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 12,
        },
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      loanReference: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      paidEmi: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      tableName: "user_transactions",
      indexes: [
        { fields: ["userId"] },
        { fields: ["userId", "month", "year"] },
        { fields: ["paidEmi"] },
      ],
    }
  );

  return UserTransaction;
};


