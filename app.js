'use strict';

import express from 'express'
import http from 'http';

import Socket from 'socket.io';
import Dataprovider from './server/Dataprovider';

const PORT = 3000;
const app = express();


app.set('port', PORT);
app.use(express.static(__dirname + '/client'));

const server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}!`);
});

const io = Socket.listen(server);
const dataprovider = new Dataprovider(io);
