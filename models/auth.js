//Elvi Mihai Sabau
const jwt = require("jsonwebtoken");
const cript = require("md5");
const conexion = require("./bdconfig");
const secreto = "Fluffy Muffin";

module.exports = class Auth {
    static AccederExternal(user, extr = false){
        return new Promise((resolve, reject) => {

            let external = false;
            
            if(extr === false)
                external = "externalGoogle";

            if(extr === true)  
                external = "externalFacebook";

            let query = "SELECT name FROM user WHERE " + external + "=? ";

            conexion.query(
                query,
                [user.externalidG],
                (error, resultado, campos) => {
                    if (error) return reject(error);
                    else if (resultado.length == 0) return reject("Usuario externo no encontrado");
                    else{
                        let token = resultado.map(uJS => this.generarToken(uJS.name))[0];
                        resolve(token);
                    } 
                }
            );
        });
    }
    static validarUsuario(usuarioJSON) {
        // console.log(usuarioJSON);
        usuarioJSON.password = cript(usuarioJSON.password);
        console.log(usuarioJSON);
        // Puede que vengan en diferente orden.
        let datos = [usuarioJSON.name, usuarioJSON.email, usuarioJSON.password];

        return new Promise((resolve, reject) => {    
            conexion.query(
                "SELECT name FROM user WHERE (name=? OR email=?) AND password=?",
                datos,
                (error, resultado, campos) => {
                    if (error) return reject(error);
                    else if (resultado.length == 0) return reject("credenciales incorrectas");
                    else{
                        let token = resultado.map(uJS => this.generarToken(uJS.name))[0];
                        resolve(token);
                    } 
                }
            );
        });
    }

    static generarToken(login) {
        console.log("generando token para: ");
        console.log(login);

        let token = jwt.sign({login: login}, secreto, {expiresIn:"30 minutes"});
        return token;
    }

    static validarToken(token) {
        /* Algo raro ha pasado, al parecer si no me equivoco, en las otras practicas aunque el token
        * fuera invalido el programa seguia ejecutandose
        * pero ahora devuelve una excepción
        * pase lo que pase, la funcion ahora está adaptada a ambas versiones de la libreria.
        * ..si es que realmente lo han cambiado y no son cosas mias...
        */

        try {
            let resultado = jwt.verify(token, secreto);
            console.log(resultado);

            // Para la versión antigua de la libreria.
            if(resultado.name != "JsonWebTokenError")
                return resultado;
            else
                return false;

        } catch (e) {
            // console.log(e);
            // para la version nueva de la libreria.
            return false;
        }
    }
}