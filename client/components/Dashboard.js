'use strict';

import sha1 from 'sha1';
import EventBus from 'eventbusjs';
import Dataprovider from './Dataprovider';

const TABLE_LENGTH = 12;

export default class Dashboard {
    constructor(rootElem) {
        this.rootElem = rootElem;
    }

    render() {
        this.domElem = $(this.template());
        this.rootElem.append(this.domElem);

        this._bind();
    }

    _bind() {
        this.domElem.find('.dashboard__subscribe').on('click', this._subscribeTables.bind(this));
        this.domElem.find('.dashboard__unsubscribe').on('click', this._unsubscribeTables.bind(this));

        EventBus.addEventListener('add_table', this._onAddTable, this);
        EventBus.addEventListener('update_table', this._onUpdateTable, this);
        EventBus.addEventListener('remove_table', this._onRemoveTable, this);

        Dataprovider.on({
            'message:table_list': this._updateTableList,
            'message:table_added': this._onTableAdded,
            'message:table_updated': this._onTableUpdated,
            'message:update_failed': this._onTableUpdateFailed,
            'message:table_removed': this._onTableRemoved,
            'message:removal_failed': this._onTableRemovalFailed
        }, this);
    }

    _isTableProcessing(table) {
        return table.hasClass('.processing');
    }

    _onAddTable(e) {
        const data = e.target;

        Dataprovider.send({
            $type: 'add_table',
            after_id: data.afterID,
            table: {
                name: data.name,
                participants: data.participants
            }
        });
    }

    _onTableAdded(data) {
        this._getTableById(data.after_id)
            .before(this._getTableHTML(data.table));
    }

    _onUpdateTable(e) {
        // make responsive update
        const data = e.target;
        const table = this._getTableById(data.id);

        if (this._isTableProcessing(table)) {
            // TODO: make responsive feedback about already processing action
            return;
        }

        const newTableInner = this._getTableInnerHTML(data);

        table
            .addClass('processing')
            .find('.table__inner').eq(0)
            .addClass('updating');

        table
            .append(newTableInner);

        Dataprovider.send({
            $type: 'update_table',
            table: data
        });
    }

    _onTableUpdated(data) {
        this._getTableById(data.id)
            .removeClass('processing')
            .find('.table__inner.updating')
            .remove();
    }

    _onTableUpdateFailed(data) {
        const table = this._getTableById(data.id);

        table
            .find('.table__inner:not(.updating)')
            .remove();

        table
            .removeClass('processing')
            .find('.table__inner').removeClass('updating');
    }

    _onRemoveTable(e) {
        const data = e.target;
        const id = data.id;

        // make responsive remove
        this._getTableById(id)
            .addClass('processing');

        Dataprovider.send({
            $type: 'remove_table',
            id: id
        });
    }

    _onTableRemoved(data) {
        this._getTableById(data.id)
            .remove();
    }

    _onTableRemovalFailed(data) {
        this._getTableById(data.id)
            .removeClass('processing');
    }

    _getTables() {
        return this.domElem.find('.dashboard__tables');
    }

    _subscribeTables() {
        Dataprovider.send({$type: 'subscribe_tables'});
    }

    _unsubscribeTables() {
        Dataprovider.send({$type: 'unsubscribe_tables'});
        this._getTables().html(''); // TODO: left tables in DOM, but indicate the unsubscribe
    }

    _addTable(afterID, name, participants) {
        Dataprovider.send({
            $type: 'add_table',
            after_id: afterID,
            table: {
                name: name,
                participants: participants
            }
        });
    }

    _updateTable(id, name, participants) {
        const table = {
            id: id,
            name: name,
            participants: participants
        };

        // TODO: seaprate to methods: tableAdd, tableRemove
        // this._getTableById(id).replaceWith(this._getTableHTML(table));

        Dataprovider.send({
            $type: 'update_table',
            table: table
        });
    }

    _updateTableList(data) {
        const tablesHTML = data.tables.splice(0, 8)
            .map((data) => this._getTableHTML(data))
            .join('');

        this._getTables()
            .html(tablesHTML);
    }

    _getTableById(id) {
        return this.domElem.find(`.table[data-id=${id}]`);
    }

    _getTableHTML(table) {
        return `
            <div class="table" data-id="${table.id}">
                ${this._getTableInnerHTML(table)}
            </div>
        `;
    }

    _getTableInnerHTML(table) {
        return `
            <div class="table__inner">
                <div class="table__title" title="${table.name}">
                    <div class="table__id">[${table.id}]</div>
                    <div class="table__name">${table.name}</div>
                </div>
                ${this._getTableParticipantsHTML(Number(table.participants))}
            </div>
        `;
    }

    _getTableParticipantsHTML(count) {
        let participants = '';

        for(let i = 0; i < TABLE_LENGTH; i++) {
            let cls = 'table__participant';

            if (i < count) {
                cls += ' active';
            }

            participants += `<div class="${cls}"></div>`;
        }

        return `<div class="table__participants">${participants}</div>`;
    }

    template() {
        return `<div class="dashboard">
            <h1 class="dashboard__title">Tables</h1>
            <button class="dashboard__subscribe">subscribe</button>
            <button class="dashboard__unsubscribe">unsubscribe</button>
            <div class="dashboard__tables"></div>
        </div>`;
    }
}
