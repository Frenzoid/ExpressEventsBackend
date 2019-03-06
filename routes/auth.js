//Elvi Mihai Sabau

const usuarioClass = require("../models/user");
const authClass = require("../models/auth");
const express = require("express");
const https = require("https");

let router = express.Router();
let sendData = { error: false, errorMessage: "", result: {} };

// rests

router.use((req, res, next) => {
  sendData = { error: false, errorMessage: "", result: {} };
  next();
});

// rutas.


function loginExternal(req, res, data){
console.log(data);
  authClass.AccederExternal(data, data.methods, false).then(resp1 => {

    sendData.result = { token: resp1 };
    console.log(sendData);
    res.end(JSON.stringify(sendData));

  }).catch(err1 => {
    console.log(err1);
    let usuario = new usuarioClass(data);
    console.log(usuario);
    usuario.register().then(resp2 => {

      if(resp2 === true) {
        sendData.result = { token: authClass.generarToken(usuario.name) };
      }

      res.end(JSON.stringify(sendData));
    }).catch(err => {
      console.log(err);

      sendData.error = true;
      sendData.errorMessage = "Error al registrar usuario externo";

      res.end(JSON.stringify(sendData));
    });
  });
}

router.post("/google", (req, res) => {
  console.log(req.body);

  loginExternal(req, res, req.body);
  
  /*
  https
    .request(
      "https://www.googleapis.com/plus/v1/people/me?access_token=" + googletoken
    )
    .on("response", resQ => {
      let body = "";
      resQ.on('data', (chunk) => {
        body += chunk
      }).on('end', () => {
        let datos = JSON.parse(body);
        console.log(datos);

        // loginExternal(req, res, datos);
      });
      
    }).end(() => {
      res.end();
    });*/

});

router.post("/facebook", (req, res) => {
// TODO.

  // loginExternal(req, res, datos);

});

router.post("/login", (req, res) => {
  let userme = {};

  authClass
    .validarUsuario(req.body)
    .then(resp1 => {
      usuarioClass
      .getUsers({ name: req.body.name, email: req.body.email }, req.body.name)
      .then(resp2 => {
        userme = resp2[0];

        console.log(req.body);
        if(req.body.lat !== undefined)
          userme.lat = req.body.lat;

        if(req.body.lng !== undefined)
          userme.lng = req.body.lng;

        userme.update().then(resp3 => {
          console.log(resp3);
        }).catch(err3 => {
          console.log(err3);
          console.log("No se pudo actualizar las cooredenadas");
        });
  
        // Es probable que la geolocalizacion falle, aún así, 
        // no es necesario actualizar las coords para hacer poder hacer login.
  
      })
      .catch(err2 => {
        console.log(err2);
        console.log("Error al encontrar al usuario via nombre.");
      });
    

      let token = resp1;
      sendData.result = { token: token };

      res.end(JSON.stringify(sendData));
    })
    .catch(err1 => {
      console.log(err1);

      sendData.error = true;
      sendData.errorMessage = err1;

      res.end(JSON.stringify(sendData));
    });
});

router.post("/register", (req, res) => {
  let usuario = new usuarioClass(req.body);
  let userCheker = usuarioClass.checkUserIntegrity(usuario);

  usuarioClass
    .getUsers(usuario)
    .then(err => {
      console.log(err);

      sendData.error = true;
      sendData.errorMessage =
        "Ya existe un usuario con el mismo nombre o email";

      res.end(JSON.stringify(sendData));
    })
    .catch(resp1 => {
      console.log(resp1);

      if (userCheker !== true) {
        sendData.error = true;
        sendData.errorMessage = userCheker;
        res.end(JSON.stringify(sendData));
      } else {
        usuario
          .register()
          .then(resp => {
            sendData.result = { token: authClass.generarToken(usuario.name) };

            res.end(JSON.stringify(sendData));
          })
          .catch(err => {
            console.log(err);

            sendData.error = true;
            sendData.errorMessage = err;

            res.end(JSON.stringify(sendData));
          });
      }
    });
});

router.get("/token", (req, res) => {
  if (!authClass.validarToken(req.get("authorization"))){
   sendData.error = true;
   sendData.errorMessage = "Token is very invalid";
  }
  else{
    sendData.error = false;
    sendData.errorMessage = "";
  }

  res.end(JSON.stringify(sendData));
});


module.exports = router;
