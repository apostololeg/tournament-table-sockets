'use strict';

import tables from './tables';

const ERROR_FREQ = 5;
const users = [
    {
        username: 'user1234',
        password: 'password1234',
        admin: true
    },
    {
        username: 'user',
        password: 'pswd'
    }
];

export default class Dataprovider {
    constructor(socket) {
        this._tables = tables;
        this._clients = {};
        this._clientsSubscribed = {};
        this._testErrorsCounts = {
            update_table: 0,
            remove_table: 0
        };

        socket.on('connection', (ws) => this._onConnection(ws));
    }

    _broadcast(clients, message) {
        Object.keys(clients)
            .forEach(id => this._send(clients[id], message));
    }

    _send(client, message) {
        client.send(message);
    }

    _onConnection(ws) {
        const clientID = Math.random();
        console.log('>> connected:', clientID);
        this._clients[clientID] = ws;
        console.log('>> total connections:', Object.keys(this._clients).length);

        ws.on('message', _data => {
            const data = JSON.parse(_data);
            console.log('>> message', data);

            switch(data.$type) {
                case 'ping':
                    this._onPing(clientID);
                break;
                case 'login':
                    this._authorize(clientID, data);
                break;
                case 'subscribe_tables':
                    this._onSubscribeTables(clientID);
                break;
                case 'unsubscribe_tables':
                    this._onUnsubscribeTables(clientID);
                break;
                case 'add_table':
                    this._onAddTable(clientID, data);
                break;
                case 'update_table':
                    this._onUpdateTable(clientID, data);
                break;
                case 'remove_table':
                    this._onRemoveTable(clientID, data);
                break;
            }
        });

        ws.on('close', () => {
            delete this._clients[clientID];
            delete this._clientsSubscribed[clientID];
        });
    }

    _onPing(clientID) {
        this._send(this._clients[clientID], {$type: 'pong'});
    }

    _authorize(clientID, data) {
        console.log(':: authorizing');
        const {username, password} = data;
        const authorized = users.find(user => {
            return user.username === username
                && user.password === password;
        });
        const answer = {};

        console.log('authorized', authorized);
        if (authorized) {
            answer.$type = 'login_successful';
            answer.user_type = authorized.admin ? 'admin' : 'user';
        } else {
            answer.$type = 'not_authorized';
        }

        this._send(this._clients[clientID], answer);
    }

    _onSubscribeTables(clientID) {
        console.log(':: subscribe_tables');

        if (this._clientsSubscribed[clientID]) {
            console.log(' : already subscribed');
            return;
        }

        const client = this._clients[clientID];

        this._clientsSubscribed[clientID] = client;
        // send table list in response
        this._send(client, {
            $type: 'table_list',
            tables: this._getTablesForClient()
        });
    }

    _onUnsubscribeTables(clientID) {
        console.log(':: unsubscribe_tables');
        delete this._clientsSubscribed[clientID];
    }

    _onAddTable(clientID, data) {
        console.log(':: add_table');
        const table = data.table;

        table.id = parseInt(table.id);

        const tableID = table.id;
        const finded = this._findTable(tableID);


        if (finded.hasTable) {
            console.log(' : adding_failed');
            this._send(this._clients[clientID], {
                $type: 'adding_failed',
                id: tableID
            });
        }

        this._tables = [
            ...this._tables.slice(0, finded.index),
            table,
            ...this._tables.slice(finded.index + 1, this._tables.length - 1)
        ];

        this._broadcast(this._clientsSubscribed, {
            $type: 'table_added',
            id: tableID
        });
    }

    _onUpdateTable(clientID, data) {
        console.log(':: update_table');
        const table = data.table;

        table.id = parseInt(table.id);

        const tableID = table.id;
        const finded = this._findTable(tableID);


        if (!finded.hasTable || this._testErrorsCounts.update_table++ > ERROR_FREQ) {
            console.log(' : update_failed');
            this._testErrorsCounts.update_table = 0;
            this._send(this._clients[clientID], {
                $type: 'update_failed',
                id: tableID
            });

            return;
        }

        this._tables[finded.index] = table;
        this._broadcast(this._clientsSubscribed, {
            $type: 'table_updated',
            id: tableID
        });
    }

    _onRemoveTable(clientID, data) {
        console.log(':: remove_table');
        const tableID = parseInt(data.id);
        const finded = this._findTable(tableID);

        if (!finded.hasTable || this._testErrorsCounts.remove_table++ > ERROR_FREQ) {
            console.log(' : removal_failed');
            this._testErrorsCounts.update_table = 0;
            this._send(this._clients[clientID], {
                $type: 'removal_failed',
                id: tableID
            });
        }

        this._tables = [
            ...this._tables.slice(0, finded.index - 1),
            ...this._tables.slice(finded.index + 1, this._tables.length - 1)
        ];

        this._broadcast(this._clientsSubscribed, {
            $type: 'table_removed',
            id: tableID
        });
    }

    _getTablesForClient() {
        return this._tables.slice(0, 20);
    }

    _findTable(id) {
        let index;
        const hasTable = this._tables.some((item, i) => {
            if (item.id === id) {
                index = i;

                return true;
            }

            return false;
        });

        return {hasTable, index};
    }
}
