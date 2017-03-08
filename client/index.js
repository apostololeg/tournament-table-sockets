import io from 'socket.io-client'

const socket = new WebSocket('wss://js-assignment.evolutiongaming.com/ws_api');
const $activity = $('.activity');

const getTables = () => $('.tables');
const getTableById = (id) => $(`.table[data-id=${id}]`);

function sendMessage(data) {
    // TODO: add spinner
    socket.send(JSON.stringify(data));
}

function drawTableView() {
    $('body').append(`
        <div class="tables-container">
            <div>tables:</div>
            <button class="subscribe-tables">subscribe tables</button>
            <button class="unsubscribe-tables">unsubscribe tables</button>
            <div class="tables">
                tables here...
            </div>
        </div>
    `);
}

function bindTableView() {
    $('.subscribe-tables').on('click', subscribeTables);
    $('.unsubscribe-tables').on('click', unsubscribeTables);
}

function drawAdminBoard() {
    $('body').append(`
        <div class="admin-board">
            <div>Admin Board</div>
            <div class="section add">
                <div>add:</div>
                <input type="text" class="table-id" placeholder="after id"/>
                <input type="text" class="table-name" placeholder="name"/>
                <input type="text" class="table-participants-count" placeholder="count"/>
                <button class="add-table">add table</button>
            </div>
            <div class="section update">
                <div>update:</div>
                <input type="text" class="table-id" placeholder="id"/>
                <input type="text" class="table-name" placeholder="name"/>
                <input type="text" class="table-participants-count" placeholder="count"/>
                <button class="update-table">update table</button>
            </div>
            <div class="section remove">
                <div>remove:</div>
                <input type="text" class="table-id" placeholder="id"/>
                <button class="remove-table">remove table</button>
            </div>
        </div>
    `);
}

function bindAdminBoard() {
    $('.add-table').on('click', onAddTableClick);
    $('.update-table').on('click', onUpdateTableClick);
    $('.remove-table').on('click', onRemoveTableClick);
}

function onAddTableClick(e) {
    // TODO: replace to forms, to use $.serialize() ;)
    const section = $(e.target).closest('.section');

    addTable(
        section.find('.table-id').val(),
        section.find('.table-name').val(),
        section.find('.table-participants-count').val()
    );
}

function onUpdateTableClick(e) {
    // TODO: replace to forms, to use $.serialize() ;)
    const section = $(e.target).closest('.section');

    updateTable(
        section.find('.table-id').val(),
        section.find('.table-name').val(),
        section.find('.table-participants-count').val()
    );
}

function onRemoveTableClick(e) {
    // TODO: replace to forms, to use $.serialize() ;)
    const section = $(e.target).closest('.section');

    removeTable(
        section.find('.table-id').val()
    );
}

function addTable(afterID, name, participants) {
    sendMessage({
        "$type": "add_table",
        "after_id": afterID,
        "table": {
            "name": name,
            "participants": participants
        }
    });
}

function updateTable(id, name, participants) {
    const table = {
        "id": id,
        "name": name,
        "participants": participants
    };

    // TODO: seaprate to methods: tableAdd, tableRemove
    getTableById(id).replaceWith(
        getTableHTML(table)
    );

    sendMessage({
        "$type": "update_table",
        "table": table
    });
}

function removeTable(id) {
    // TODO: check the API
    getTableById(id).remove();

    sendMessage({
        "$type": "remove_table",
        "id": id
    });
}


function subscribeTables() {
    sendMessage({
        "$type": "subscribe_tables"
    });
}
function unsubscribeTables() {
    sendMessage({
        "$type": "unsubscribe_tables"
    });
    getTables().html('');
}

function getTableHTML(table) {
    let participants = '';
    let filledCount = table.participants;

    for(let i = 0; i < 12; i++) {
        let cls = 'table__participant';

        if (i < filledCount) {
            cls += ' active';
        }

        participants += `<div class="${cls}"></div>`;
    }

    return `
        <div class="table" data-id="${table.id}">
            <div class="table__id">[${table.id}]</div>
            <div class="table__name">${table.name}</div>
            <div class="table__participants">
                ${participants}
            </div>
        </div>
    `;
}

function updateTables(tables) {
    const tablesHTML = tables.splice(0, 5).map(getTableHTML);

    getTables().html(tablesHTML);
}

socket.onopen = () => {
    console.log('connected');

    // ping
    setInterval(() => {
        sendMessage({
            "$type": "ping",
            "seq": 1
        });
    }, 1000);

    // auth
    // TODO: must depend from ping status (?)
    sendMessage({
        "$type": "login",
        "username": "user1234",
        "password": "password1234"
    });
};

socket.onmessage = res => {
    const data = JSON.parse(res.data);

    if (data.$type !== 'pong') {
        console.log('onmesssage');
        console.log(data);
    }

    // drop activity status
    $activity.removeClass('active');

    switch(data.$type) {
        case 'pong':
            $activity.addClass('active');
        break;

        case 'login_failed':
            console.log('Login Failed!');
        break;

        case 'not_authorized':
            console.log('Not Authorized!');
        break;

        case 'login_successful':
            console.log('Login Succesful');

            drawTableView();
            bindTableView();

            if (data.user_type === 'admin') {
                drawAdminBoard();
                bindAdminBoard();
            }
        break;

        case 'table_list':
            updateTables(data.tables);
        break;

        case 'table_added':
            // TODO: check the API
            getTableById(data.after_id).after(
                getTableHTML(data.table)
            );
        break;

        // case 'table_removed':
        // break;

        // case 'table_updated':
        // break;

        case 'removal_failed':
        break;

        case 'update_failed':
            getTableById(data.id).remove();
        break;
    }
};

socket.onerror = res => {
    console.log('onerror');
    console.log(res);
};
