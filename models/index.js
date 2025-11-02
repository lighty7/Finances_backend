const { Sequelize } = require("sequelize");
require("dotenv").config();

// Initialize Sequelize connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: console.log,
});

const db = {};

// Import models by passing sequelize instance
db.Users = require("./users")(sequelize);

// Export sequelize instance
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Function to sync all models
db.initialize = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    await sequelize.sync({ alter: true });
    console.log("✅ All tables created/updated successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
};

module.exports = db;
