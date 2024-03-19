const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const exphbs = require('express-handlebars');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuración de Handlebars
app.engine('.handlebars', exphbs({ extname: '.handlebars' }));
app.set('view engine', '.handlebars');
app.set('views', path.join(__dirname, 'views'));

// Rutas
const cartsRouter = require('./routes/cartsRouter');
const viewsRouter = require('./routes/viewsRouter');
app.use('/carts', cartsRouter);
app.use('/', viewsRouter(io));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor iniciado en el puerto ${PORT}`));
