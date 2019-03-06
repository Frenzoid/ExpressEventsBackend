// Frenzoid

const express = require('express');
const auth = require('./routes/auth');
const users = require('./routes/user');
const events = require('./routes/events');
const bodyParser = require('body-parser');
const cors = require('cors');
let app = express();

// configuración para las imagenes en base64
app.use(express.json({limit: '50mb'}));

// bodyparser
app.use(bodyParser.json());

// cors
app.use(cors());
    
// despliegue de imagenes.
app.use('/public', express.static('public'));

// rutas
app.use('/auth', auth);
app.use('/users', users);
app.use('/events', events);

// desplegador
app.listen(2020);
