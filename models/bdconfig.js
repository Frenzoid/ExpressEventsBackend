//Elvi Mihai Sabau
const mysql = require("mysql");

let conexion = mysql.createConnection({
  host: "212.237.62.148",
  user: "NODE",
  password: "NODE",
  database: "svtickets"
});

module.exports = conexion;