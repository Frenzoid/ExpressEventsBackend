//Elvi Mihai Sabau

const conexion = require("./bdconfig");
const fs = require("fs");
const gestImage = require("./gestImages");
const cript = require("md5");

module.exports = class User {
  constructor(jsonUser) {
    this.id = jsonUser.id;
    this.externalidG = jsonUser.externalidG;
    this.externalidF = jsonUser.externalidF;
    this.name = jsonUser.name;
    this.avatar = jsonUser.avatar;
    this.email = jsonUser.email;
    this.email2 = jsonUser.email2;
    this.password = jsonUser.password;
    this.lat = jsonUser.lat;
    this.lng = jsonUser.lng;
    this.me = jsonUser.me | false;
  }

  static checkUserIntegrity(jsonUser) {
    if (!jsonUser.name) {
      console.log(jsonUser.name);
      return "El campo nombre no puede estar vacio";
    }

    if (!jsonUser.avatar) {
      console.log(jsonUser.name);
      return "Se requiere un avatar";
    }

    if (!(jsonUser.email && jsonUser.email2)) {
      console.log(jsonUser.email);
      console.log(jsonUser.email2);
      return "El campo email debe ser completado";
    }

    if (jsonUser.email != jsonUser.email2) {
      console.log(jsonUser.email);
      console.log(jsonUser.email2);
      return "Los emails no coinciden";
    }

    if (!jsonUser.password) {
      console.log(jsonUser.password);
      return "El campo contraseña no puede estar vacio";
    }

    return true;
  }

  update() {
    return new Promise((resolve, reject) => {
      let datos = {
        name: this.name,
        email: this.email,
        lat: this.lat,
        lng: this.lng
      };

      console.log(datos);

      if (this.avatar != undefined && this.avatar.includes("base64")) {
        let ava = this.avatar;
        this.avatar =
          "public/images/avatars/" +
          this.name +
          "." +
          gestImage.getFormat(ava, "base64");
        gestImage.saveImage(this.avatar, ava);
        datos = Object.assign(datos, { avatar: this.avatar });
      }

      if(this.avatar != undefined && this.password.includes("=N=")){
        this.password = cript(this.password.split("=N=")[0]);
        datos = Object.assign(datos, { password: this.password });
      }


      conexion.query(
        "UPDATE user SET ? WHERE id = ? ",
        [datos, this.id],
        (error, resultado, campos) => {
          if (error) return reject(error);
          else resolve(resultado.affectedRows);
        }
      );
    });
  }


  register() {
    return new Promise((resolve, reject) => {
      let ava;

      if (this.lat == null || this.lat == undefined || this.lat == "")
        this.lat = 0;

      if (this.lng == null || this.lng == undefined || this.lng == "")
        this.lng = 0;

      if(!this.avatar.includes("://")){
      ava = this.avatar;
      this.avatar =
        "public/images/avatars/" +
        this.name +
        "." +
        gestImage.getFormat(ava, "base64");
        console.log(ava);
      }
      

      if(this.password != undefined)
        this.password = cript(this.password);
      else
        this.password = cript(Math.random());
      
      console.log(this);
      

      conexion.query(
        "INSERT INTO user (name, email, password, avatar, lat, lng, externalGoogle, externalFacebook) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          this.name,
          this.email,
          this.password,
          this.avatar,
          this.lat,
          this.lng,
          this.externalidG,
          this.externalidF
        ],
        (error, resultado, campos) => {
          if (error) return reject(error);
          else {
            if(!this.avatar.includes("://")){
              gestImage.saveImage(this.avatar, ava);
            }
            return resolve(true);
          }
        }
      );
    });
  }

  static getUsers(data = "", me = false) {
    return new Promise((resolve, reject) => {
      if (data == "") return reject("No se ha especificado un usuario");

      conexion.query(
        "SELECT * FROM user WHERE name=? OR id=? OR email=?",
        [data.name, data.id, data.email],
        (error, resultado, campos) => {
          if (error) return reject(error);
          else {
            console.log(resultado.length);

            if (resultado.length == 0)
              return reject("No se ha encontrado el usuario");
            else
              return resolve(
                resultado.map(uJS => {
                  let usr = new User(uJS);

                  console.log(me);
                  console.log(usr.name);

                  if (me == usr.name) usr.me = true;
                  else usr.me = false;

                  return usr;
                })
              );
          }
        }
      );
    });
  }
};
