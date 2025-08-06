require("dotenv").config();

module.exports = {
  development: {
    client: "mysql2",
    connection: {
      database: "petshots_db",
      user: 'root',
      password: '0000'
    },
    migrations: {
      tableName: "knex_migrations",
      directory: `${__dirname}/src/database/migrations`,
    },
  },

  production: {
    client: "mysql2",
    connection: {
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      host: '127.0.0.1',
      port: 3306
    },
    migrations: {
      tableName: "knex_migrations",
      directory: `${__dirname}/src/database/migrations`,
    },
  }
};
