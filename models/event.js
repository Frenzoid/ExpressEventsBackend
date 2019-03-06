//Elvi Mihai Sabau
const conexion = require("./bdconfig");
const usuarioClass = require("./user");
const gestImage = require("./gestImages");
const ticketClass = require("./tickets");

module.exports = class Event {
  constructor(jsonItem) {
    this.id = jsonItem.id;
    this.creator = jsonItem.creator;
    this.title = jsonItem.title;
    this.description = jsonItem.description;
    this.date = jsonItem.date;
    this.price = jsonItem.price;
    this.lat = jsonItem.lat;
    this.lng = jsonItem.lng;
    this.address = jsonItem.address;
    this.image = jsonItem.image;
    this.numAttend = jsonItem.numAttend;
  }

  static checkEventIntegrity(jsonEvent) {
    if (!jsonEvent.title || jsonEvent.title == "") {
      console.log(jsonEvent.title);
      return "El titulo no puede estar vacio";
    }

    if (!jsonEvent.description || jsonEvent.description == "") {
      console.log(jsonEvent.description);
      return "La descripcion no puede estar vacia";
    }

    if (!jsonEvent.date || jsonEvent.date == "") {
      console.log(jsonEvent.date);
      return "La fecha no puede estar vacia";
    }

    if (!jsonEvent.price || jsonEvent.price == "" || jsonEvent.price == 0) {
      console.log(jsonEvent.price);
      return "El precio no puede estar vacio o ser 0";
    }

    if (!jsonEvent.address || jsonEvent.address == "") {
      console.log(jsonEvent.address);
      return "La direccion no puede estar vacia";
    }

    if (!jsonEvent.image || jsonEvent.image == "") {
      console.log(jsonEvent.image);
      return "La imagen no puede estar vacia";
    }

    return true;
  }

  create(){
    return new Promise((resolve, reject) => {

      if (this.lat == null || this.lat == undefined || this.lat == "")
        this.lat = 0;

      if (this.lng == null || this.lng == undefined || this.lng == "")
        this.lng = 0;

      let ava = this.image;
      this.image = "public/images/thumbnails/" + this.title + "." + gestImage.getFormat(ava, "base64");
      console.log(this.image);

      conexion.query(
        "INSERT INTO event (title, creator, description, date, price, lat, lng, address, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          this.title,
          this.creator,
          this.description,
          this.date,
          this.price,
          this.lat,
          this.lng,
          this.address,
          this.image
        ],
        (error, resultado, campos) => {
          if (error) return reject(error);
          else {
            gestImage.saveImage(this.image, ava);
            return resolve(true);
          }
        }
      );
    });
  }

  static delete(id){
    return new Promise((resolve, reject) => {
      conexion.query(
        "DELETE FROM event WHERE id=? ",
        [id],
        (error, resultado, campos) => {
          if (error) return reject(error);
          else resolve(resultado.affectedRows);
        }
      );
    });
  }
  
  update() {
    console.log(this.id);
    let ava = this.image;
    if (ava.includes("base64")) {
      this.image = "public/images/thumbnails/" + this.title + "." + gestImage.getFormat(ava, "base64");
      // console.log(ava);
      gestImage.saveImage(this.image, ava);
    }

    // creamos una variable para insercionar y borramos los atributos fantasma.
    let submitevent = new Event(this);
    delete submitevent.numAttend;
    delete submitevent.id;
    delete submitevent.creator;
    delete submitevent.mine;

    console.log(submitevent);
    console.log(this.id);

    return new Promise((resolve, reject) => {
      conexion.query(
        "UPDATE event SET ? WHERE id=? ",
        [submitevent, this.id],
        (error, resultado, campos) => {
          if (error) return reject(error);
          else resolve(resultado.affectedRows);
        }
      );
    });
  }

  static showEvents(filters = false, me) {
    return new Promise((resolve, reject) => {
        let query = "SELECT * FROM event ";
        let proquery = " WHERE creator=? OR id=? or title=?";
  
        if (filters != false) query += proquery;

        console.log(query);
        console.log(filters);

        conexion.query(query, [filters.creator, filters.id, filters.title], (error, resultado, campos) => {
            if (error) return reject(error);
            else {
                console.log("Lenght eventos: " + resultado.length);

                if (resultado.length == 0)
                    return reject("No se ha encontrado el evento");
                else{
                    
                    return resolve(resultado.map(eJS => {
                            let event = new Event(eJS);
                            if(me.id == event.creator)
                                event.mine = true;
                            else
                                event.mine = false;

                            return event;
                        }));    
                    }
                }
            });
    });
  }

  static getHaversine(event, user){
    return new Promise((resolve, reject) => {
      let query = "SELECT haversine(?, ?, ?, ?) as distance";
      console.log(user.name);
      console.log(event.title);

      conexion.query(query,[event.lat, event.lng, user.lat, user.lng], (error, resultado, campos) => {
        if(error) return reject(error);
        else{
          console.log(resultado);
          console.log(resultado[0].distance);
          return resolve(resultado[0].distance);
        }
      });
    });
  }

  static getAttend(me) {
    return new Promise((resolve, reject) => {
      ticketClass
        .getTickets({ user: me.id })
        .then(resp1 => {

          let events = [];

          resp1.forEach(element => {
            this.showEvents({id: element.event.id}, me)
              .then(resp2 => {
                console.log(resp2[0]);
                events.push(resp2[0]);
                console.log("pusheado evento al array local");
                return resolve(events);
              })
              .catch(err2 => {
                console.log(err2);
                return reject(
                  "error al seleccionar un evento asociado a un ticket"
                );
              });
          });

          console.log(events);
          return resolve(events);
        })
        .catch(err1 => {
          console.log(err1);
          return reject("error al seleccionar los tickets");
        });
    });
  }
};
