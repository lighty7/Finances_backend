const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UserSessions = sequelize.define(
    "user_sessions",
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
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Unique device/system identifier",
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "IP address of the user",
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Browser/client user agent",
      },
      deviceInfo: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: "Additional device information",
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: "JWT token for this session",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Whether the session is currently active",
      },
      lastActivity: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Last activity timestamp",
      },
      loggedOutAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Logout timestamp",
      },
    },
    {
      timestamps: true,
      tableName: "user_sessions",
      indexes: [
        {
          fields: ["userId"],
        },
        {
          fields: ["deviceId"],
        },
        {
          fields: ["token"],
          unique: true,
        },
        {
          fields: ["isActive"],
        },
      ],
    }
  );

  return UserSessions;
};


