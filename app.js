'use strict';

import express from 'express'
import http from 'http'
import io from 'socket.io'

const app = express();
const server = http.createServer(app);

app.set('port', 3000);
app.use(express.static(__dirname + '/client'));

io.listen(server).on('connection', socket => {
    socket.on('message', data => {
        console.log(`receive: ${data.text}`);
        socket.emit('message', {text: 'pong'});
    });
});

server.listen(app.get('port'), () => {
    console.log(`Listening
        port ${app.get('port')}
        in ${app.get('env')} mode`
    );
});

module.exports = app;
