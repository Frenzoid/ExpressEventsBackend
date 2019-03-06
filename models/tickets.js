// Elvi Mihai Sabau
const conexion = require("./bdconfig");

module.exports = class Ticket {
  constructor(jsonTicket) {
    this.event = jsonTicket.event;
    this.user = jsonTicket.user;
    this.tickets = jsonTicket.tickets;
  }

  static getTickets(filters = false) {
    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM user_attend_event ";
      let proquery = " WHERE user=? OR event=? ";

      if (filters != false) query += proquery;

      console.log(query);
      console.log(filters);
      
      conexion.query(
        query,
        [filters.user, filters.event],
        (error, resultado, campos) => {
          if (error) return reject(error);
          else {
            return resolve(resultado.map(tJS => new Ticket(tJS)));
          }
        }
      );
    });
  }

  attend(){
    return new Promise((resolve, reject) => {
      conexion.query(
        "INSERT INTO user_attend_event ( user, event, tickets ) VALUES ( ?, ?, ?)  ON DUPLICATE KEY UPDATE tickets=tickets+?",
        [this.user, this.event, this.tickets, this.tickets],
        (error, resultado, campos) => {
          if (error) return reject(error);
          else {
            return resolve(true);
          }
        }
      );
    });
  }
};
