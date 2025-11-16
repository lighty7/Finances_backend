const { Sequelize } = require("sequelize");
const config = require("../config/config");

// Initialize Sequelize connection
const sequelize = new Sequelize(config.database.url, {
  dialect: "postgres",
dialectOptions: {
  ssl: { require: true, rejectUnauthorized: false }
},
  logging: config.database.logging,
});

const db = {};

// Import models by passing sequelize instance
db.Users = require("./users")(sequelize);
db.UserSessions = require("./userSessions")(sequelize);
db.UserConfiguration = require("./userConfiguration")(sequelize);

// Define associations
db.Users.hasMany(db.UserSessions, {
  foreignKey: "userId",
  as: "sessions",
  onDelete: "CASCADE",
});

db.UserSessions.belongsTo(db.Users, {
  foreignKey: "userId",
  as: "user",
});

db.Users.hasOne(db.UserConfiguration, {
  foreignKey: "userId",
  as: "configuration",
  onDelete: "CASCADE",
});

db.UserConfiguration.belongsTo(db.Users, {
  foreignKey: "userId",
  as: "user",
});

// Export sequelize instance
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Function to sync all models
db.initialize = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Only sync with alter in development
    if (config.isDevelopment) {
      await sequelize.sync({ alter: config.database.sync.alter });
      console.log("✅ All tables created/updated successfully");
    } else {
      // In production, just verify connection without syncing
      console.log("✅ Database connection verified (production mode - no auto-sync)");
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
};

module.exports = db;
