require("dotenv").config();

module.exports = {
  development: {
    client: "mysql2",
    connection: {
      database: "petshots_db",
      user:     'root',
      password: '0000'
    },
    migrations: {
      tableName: "knex_migrations",
      directory: `${__dirname}/src/database/migrations`,
    },
  },
};