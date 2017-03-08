'use strict';

import express from 'express'
import http from 'http'

const PORT = 3000;
const app = express();
const server = http.createServer(app);

app.set('port', PORT);
app.use(express.static(__dirname + '/client'));

app.listen(PORT, () => {
    console.log(`App running on port ${PORT}!`);
});

