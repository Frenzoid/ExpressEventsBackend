const usuarioClass = require("../models/user");
const authClass = require("../models/auth");
const express = require("express");

let router = express.Router();
let sendData = { error: false, errorMessage: "", result: {} };
let userName = false;


// Interceptadores (Middlewares)

router.use((req, res, next) => {
  sendData = { error: false, errorMessage: "", result: {} };
  next();
});

router.use((req, res, next) => {
  userName = false;
  let token = req.get("authorization");
  userName = authClass.validarToken(token);

  console.log(token);
  console.log(userName);
  
  if(token == undefined || token == null){
    sendData.error = true;
    sendData.errorMessage = "Acceso denegado";
    res.statusCode = 400;
    next({ auth: false });
  }
  else if (userName === false || userName == undefined || userName == null) {
    sendData.error = true;
    sendData.errorMessage = "token invalido o caducado";
    res.statusCode = 400;
    next({ auth: false });
  } else {
    userName = userName.login;
    next({ auth: true });
  }
});

router.use((err, req, res, next) => {
  console.log(err);

  if (err.auth){ 
    sendData.result = { token: authClass.generarToken(userName) };
    next();
  }else{
    res.end(JSON.stringify(sendData));
  }
});

// rutas

router.get("/me", (req, res) => {
  usuarioClass
    .getUsers({ name: userName }, userName)
    .then(resp => {
      console.log(resp);
      sendData.result = Object.assign(sendData.result, { users: resp[0] });

      res.end(JSON.stringify(sendData));
    })
    .catch(err => {
      console.log(err);
      sendData.error = true;
      sendData.errorMessage = err;

      res.end(JSON.stringify(sendData));
    });
});

router.get("/:id", (req, res) => {
  let id = req.params.id;
  usuarioClass
    .getUsers({ id: id }, userName)
    .then(resp => {
      console.log(resp);
      sendData.result = Object.assign(sendData.result, { users: resp[0] });

      res.end(JSON.stringify(sendData));
    })
    .catch(err => {
      console.log(err);
      sendData.error = true;
      sendData.errorMessage = err;

      res.end(JSON.stringify(sendData));
    });
});

router.put("/me", (req, res) => {
  let userme = {};

  usuarioClass
    .getUsers({ name: userName }, userName)
    .then(resp => {
      console.log(resp);
      userme = resp[0];

      console.log(req.body);

      if (!((req.body.name == undefined || req.body.name == "") && (req.body.email == undefined || req.body.email == ""))) {
        if (req.body.name != undefined && req.body.name != "")
          userme.name = req.body.name;

        if (req.body.email != undefined && req.body.email != "")
          userme.email = req.body.email;

        usuarioClass
          .getUsers(userme, userName)
          .then(resp => {
            console.log(resp);
            if (resp[0].id != userme.id) {
              sendData.error = true;
              sendData.errorMessage =
                "Ya existe un usuario con el mismo nombre y/o email";

              res.end(JSON.stringify(sendData));
            } else {
              userme
                .update()
                .then(resp => {
                  console.log(resp);
                  sendData.result = Object.assign(
                    { token: authClass.generarToken(userme.name) },
                    { users: userme }
                  );

                  res.end(JSON.stringify(sendData));
                })
                .catch(err => {
                  console.log(err);
                  sendData.error = true;
                  sendData.errorMessage = "Error al actualizar el perfil";

                  res.end(JSON.stringify(sendData));
                });
            }
          })
          .catch(err => {
            if (err == "No se ha encontrado el usuario") {
              userme
                .update()
                .then(resp => {
                  console.log(resp);
                  sendData.result = Object.assign(
                    { token: authClass.generarToken(userme.name) },
                    { users: userme }
                  );

                  res.end(JSON.stringify(sendData));
                })
                .catch(err => {
                  console.log(err);
                  sendData.error = true;
                  sendData.errorMessage = "Error al actualizar el perfil";

                  res.end(JSON.stringify(sendData));
                });
            }
          });
      } else {
        sendData.error = true;
        sendData.errorMessage = "No puedes dejar ambos campos vacios";
        res.end(JSON.stringify(sendData));
      }
    })
    .catch(err => {
      console.log(err);
      sendData.error = true;
      sendData.errorMessage = err;

      res.end(JSON.stringify(sendData));
    });
});

router.put("/me/avatar", (req, res) => {
  let userme = {};

  usuarioClass
    .getUsers({ name: userName }, userName)
    .then(resp => {
      console.log(resp);
      userme = resp[0];

      if (req.body.avatar != undefined && req.body.avatar != "") {
        userme.avatar = req.body.avatar;

        userme
          .update()
          .then(resp => {
            console.log(resp);
            sendData.result = Object.assign(sendData.result, {
              users: userme
            });

            res.end(JSON.stringify(sendData));
          })
          .catch(err => {
            console.log(err);
            sendData.error = true;
            sendData.errorMessage = "Error al actualizar el perfil";

            res.end(JSON.stringify(sendData));
          });
      } else {
        sendData.error = true;
        sendData.errorMessage = "Debes elejir una foto de perfil antes";
        res.end(JSON.stringify(sendData));
      }
    })
    .catch(err => {
      console.log(err);
      sendData.error = true;
      sendData.errorMessage = err;

      res.end(JSON.stringify(sendData));
    });
});

router.put("/me/password", (req, res) => {
  usuarioClass
    .getUsers({ name: userName }, userName)
    .then(resp => {
      console.log(resp);
      let userme = resp[0];
      console.log(userme);

      if (
        req.body.password != undefined &&
        req.body.password != "" &&
        req.body.password == req.body.password2
      ) {
        userme.password = req.body.password;
        userme.password += "=N="; // esto lo usamos par saber que la contraseña es una contraseña nueva en el update y hay que encriptar.

        userme
          .update()
          .then(resp => {
            console.log(resp);
            sendData.result = Object.assign(sendData.result, {
              users: userme
            });

            res.end(JSON.stringify(sendData));
          })
          .catch(err => {
            console.log(err);
            sendData.error = true;
            sendData.errorMessage = "Error al actualizar el perfil";

            res.end(JSON.stringify(sendData));
          });
      } else {
        sendData.error = true;
        sendData.errorMessage =
          "Las contraseñas no coinciden o estan en blanco";
        res.end(JSON.stringify(sendData));
      }
    })
    .catch(err => {
      console.log(err);
      sendData.error = true;
      sendData.errorMessage = err;

      res.end(JSON.stringify(sendData));
    });
});

router.use((req, res, next) => {
  res.end(JSON.stringify(sendData));
});

module.exports = router;
