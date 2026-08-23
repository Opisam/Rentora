import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Production hosts (Render, Railway, Heroku...) provide a single connection
// string; local dev uses the discrete variables from .env
function makeSequelize() {
  if (process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      ssl: undefined,
      dialectOptions:
        process.env.DB_SSL === 'true'
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : {},
    });
  }

  return new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false,
    }
  );
}

const sequelize = makeSequelize();

export default sequelize;
