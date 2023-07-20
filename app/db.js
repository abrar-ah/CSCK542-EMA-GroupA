const mysql = require('mysql2');

// Create the connection pool
const connPool = mysql.createPool({

  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,

});

// Gets the connection to the database
function GetDbPool() {
  return connPool.promise()
}

module.exports = { GetDbPool };