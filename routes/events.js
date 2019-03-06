const usuarioClass = require("../models/user");
const eventClass = require("../models/event");
const ticketClass = require("../models/tickets");
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
    
    if(token == undefined || token == null) {
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
    } else {
        res.end(JSON.stringify(sendData));
    }
});


// rutas

router.get("/attend", (req, res) => {
    getMultiEvents("ATTEND",req, res);
});

router.get("/mine", (req, res) => {
    getMultiEvents("MINE",req, res);
});

router.get("/", (req, res) => {
    getMultiEvents("ALL",req, res);
});

router.get("/user/:id", (req, res) => {
    getMultiEvents("USERSONES",req, res);
});


router.get("/:id", (req, res) => {
    getMultiEvents("ID", req, res);
});

router.get("/attendants/:id", (req, res, next) => {

    let id = req.params.id;
    let attendants = [];
    let userme = {};
    usuarioClass.getUsers({name: userName}).then(resp1 => {
        console.log(resp1);
        userme = resp1[0];

        return userme;
    }).then(userme => {
        ticketClass.getTickets({event: id}).then(resp2 => {
            console.log(resp2);
            resp2.forEach((ticket, index, array) => {
                usuarioClass.getUsers({id: ticket.user}, userme.name).then(resp3 => {
                    //console.log(resp3);
                    attendants.push(resp3[0]);

                    if(index === array.length -1){
                        //console.log(attendants);
                        sendData.result = Object.assign(sendData.result,{attendants: attendants});
                        res.end(JSON.stringify(sendData));
                    }
                }).catch(err3 => {
                    console.log(err3);
                    sendData.error = true;
                    sendData.errorMessage = "Error al sacar los atendientes";
            
                    res.end(JSON.stringify(sendData));
                });
            });
            // y si no hay atendientes:
            if(resp2.length == 0){
                sendData.result = Object.assign(sendData.result,{attendants: attendants});
                res.end(JSON.stringify(sendData));
            }
        }).catch(err2 => {
            console.log(err2);
            sendData.error = true;
            sendData.errorMessage = "Error al sacar los tickets";
    
            res.end(JSON.stringify(sendData));
        });
    }).catch(err1 => {
        console.log(err1);
        sendData.error = true;
        sendData.errorMessage = err1;

        res.end(JSON.stringify(sendData));
    });
});

router.post("/attend/:id", (req, res) => {
    let id = req.params.id;
    let userme = null;
    
    usuarioClass.getUsers({name: userName}).then(resp1 => {
        console.log(resp1);
        userme = resp1[0];
        return userme;
    }).then(userme => {
        console.log(req.body.quantity);
        if(req.body.quantity != null && req.body.quantity > 0 && req.body.quantity != undefined && req.body.quantity != false){
            console.log(userme);
            let ticket = new ticketClass({user: userme.id, event: id, tickets: req.body.quantity});
            ticket.attend().then(resp2 => {
                console.log(resp2);
                if(resp2)
                    sendData.result = Object.assign(sendData.result, {attend: resp2, users: userme}); 

                res.end(JSON.stringify(sendData));
            }).catch(err2 => {
                console.log(err2);
                sendData.error = true;
                sendData.errorMessage = "Error al crear una factura";
        
                res.end(JSON.stringify(sendData));
            });
        }else{
            sendData.error = true;
            sendData.errorMessage = "No puedes comprar 0 entradas";
    
            res.end(JSON.stringify(sendData));
        }
    }).catch(err1 => {
        console.log(err1);
        sendData.error = true;
        sendData.errorMessage = err1;

        res.end(JSON.stringify(sendData));
    });
});

router.post("/", (req, res) => {
    let event = null;
    let userme = null;
    usuarioClass.getUsers({name: userName}).then(resp1 => {
        console.log(resp1);
        userme = resp1[0];

        let checker = eventClass.checkEventIntegrity(req.body);
        if(checker !== true){
            console.log(checker);
            sendData.error = true;
            sendData.errorMessage = checker;
    
            res.end(JSON.stringify(sendData));            
        }else if(checker === true){
            eventClass.showEvents({title: req.body.title}, userme).then(resp2 => {
                console.log(resp2);
                sendData.error = true;
                sendData.errorMessage = "Ya hay un evento con el mismo titulo";
        
                res.end(JSON.stringify(sendData));
            }).catch(err2 => {
                if(err2 == "No se ha encontrado el evento"){
                    event = new eventClass(req.body);
                    event.creator = userme.id;
                    event.create().then(resp3 => {
                        console.log(resp3);
                        sendData.error = !resp3;
                        sendData.result = Object.assign(sendData.result,{events: [event]}); 
                        res.end(JSON.stringify(sendData));
                    }).catch(err3 => {
                        console.log(err3);
                        sendData.error = true;
                        sendData.errorMessage = "Error al crear el nuevo evento";
                
                        res.end(JSON.stringify(sendData));
                    });
                }
            });
            
        }
    }).catch(err1 => {
        console.log(err1);
        sendData.error = true;
        sendData.errorMessage = err1;

        res.end(JSON.stringify(sendData));
    });
});
 
router.put("/:id", (req, res) => {
    let id = req.params.id;
    let userme = {};
    usuarioClass.getUsers({name: userName}).then(resp1 => {
        console.log(resp1);
        userme = resp1[0];

        let checker = eventClass.checkEventIntegrity(req.body);
        if(checker !== true){
            console.log(checker);
            sendData.error = true;
            sendData.errorMessage = checker;
    
            res.end(JSON.stringify(sendData));
            
        }else if(checker === true){
            eventClass.showEvents({id : id}, userme).then(resp2 => {
                console.log(resp2[0]);
                let event = new eventClass(req.body);
                event.mine = resp2[0].mine;
                event.id = id;
                console.log(event.id);
                // console.log(event);
                return event;
            }).then(event => {
                if(event.mine){
                    event.update().then(resp3 => {
                        console.log(resp3);
                        sendData.result = Object.assign(sendData.result,{events: [event]});
                        res.end(JSON.stringify(sendData));
                    }).catch(err3 => {
                        console.log(err3);
                        sendData.errorMessage = "Error al actualizar el evento";
                        res.end(JSON.stringify(sendData));
                    });
                }else{
                    sendData.error = true;
                    sendData.errorMessage = "No es tu evento";
                    res.end(JSON.stringify(sendData));
                }
            }).catch(err2 => {
                console.log(err2);
                sendData.error = true;
                sendData.errorMessage = err2;

                res.end(JSON.stringify(sendData));
            });
        }
    }).catch(err1 => {
        console.log(err1);
        sendData.error = true;
        sendData.errorMessage = err1;

        res.end(JSON.stringify(sendData));
    });
});
  
router.delete("/:id", (req, res) => {
    let id = req.params.id;
    let userme = {};
    usuarioClass.getUsers({name: userName}).then(resp1 => {
        console.log(resp1);
        userme = resp1[0];
        eventClass.showEvents({id : id}, userme).then(resp2 => {
            console.log(resp2[0]);
            if(resp2[0].mine === true)
            {
                eventClass.delete(id).then(resp3 => {
                    sendData.result = sendData.result = Object.assign(sendData.result,{events: resp2});
    
                    res.end(JSON.stringify(sendData));
                }).catch(err3 => {
                    console.log(err3);
                    sendData.error = true;
                    sendData.errorMessage = "Error al borrar el evento";
    
                    res.end(JSON.stringify(sendData));
                });
            }else{
                sendData.error = true;
                sendData.errorMessage = "No es tu evento";

                res.end(JSON.stringify(sendData));
            }
        }).catch(err2 => {
            console.log(err2);
            sendData.error = true;
            sendData.errorMessage = err2;

            res.end(JSON.stringify(sendData));
        });
    }).catch(err1 => {
        console.log(err1);
        sendData.error = true;
        sendData.errorMessage = err1;

        res.end(JSON.stringify(sendData));
    });
});

function getMultiEvents(whatdoyouwant, req, res){
    let userme = {};
    let events = [{}];
    let filters1 = {};
    let filters2 = false;

     usuarioClass.getUsers({name: userName}, userName).then(resp1 =>{
        console.log("usuario");
        console.log(resp1);
        userme = resp1[0];

        switch(whatdoyouwant){
            case "ID":
                filters1 = {id: req.params.id};
            break;
            case "MINE":
                filters1 = {creator: userme.id};
            break;
            case "ALL":
                filters1 = false;
            break;
            case "USERSONES":
                filters1 = {creator: req.params.id};
            break;
            case "ATTEND":
                filters1 = false;
                filters2 = true;
            break;
        }

        eventClass.showEvents(filters1, userme).then(resp2 => {
            console.log(resp2);
            resp2.forEach(event => {
                usuarioClass.getUsers({ id: event.creator }, userme.name)
                .then(resp3 => {
                    event.creator = resp3[0];

                    console.log(userme);
                    console.log(resp3[0]);
                    console.log(event);

                    return event;
                }).then(event => {

                    ticketClass.getTickets({ event: event.id, user: userme.id })
                    .then(resp4 => {
                        console.log(resp4);
                        event.attend = false;

                        resp4.forEach(ticket => {
                            console.log(ticket);
                            if(ticket.user == userme.id && ticket.event == event.id)
                                event.attend = true;
                        });

                        eventClass.getHaversine(event, userme).then(resp5 => {
                            console.log(resp5);
                            event.distance = resp5;

                            console.log(event);

                            if(resp2[resp2.length - 1].id == event.id){
                                
                                if(filters2 == true)
                                    sendData.result = Object.assign(sendData.result,{events: resp2.filter(eve => eve.attend == true)});
                                else
                                    sendData.result = Object.assign(sendData.result,{events: resp2});

                                res.end(JSON.stringify(sendData));
                            }
                        }).catch(err5 => {
                            console.log(err5);
                            sendData.error = true;
                            sendData.errorMessage = "Error a la hora de sacar la distancia entre el usuario y el evento";
                    
                            res.end(JSON.stringify(sendData));
                        });
                    })
                    .catch(err4 => {
                        console.log(err4);
                        sendData.error = true;
                        sendData.errorMessage = "Error a la hora de sacar un attend de un evento";
                
                        res.end(JSON.stringify(sendData));
                    });

                })
                .catch(err3 => {
                    console.log(err3);
                    sendData.error = true;
                    sendData.errorMessage = "Error a la hora de sacar un usuario creador de un evento";
            
                    res.end(JSON.stringify(sendData));
                });
            });
        }).catch(err => {
            console.log(err);
            sendData.error = true;
            sendData.errorMessage = err;
    
            res.end(JSON.stringify(sendData));
        });
    }).catch(err => {
        console.log(err);
        sendData.error = true;
        sendData.errorMessage = err;

        res.end(JSON.stringify(sendData));
    });
}

module.exports = router;
