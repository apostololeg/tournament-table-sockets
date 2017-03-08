import EventBus from 'eventbusjs';

export default class AdminBoard {
    constructor(rootElem) {
        this.rootElem = rootElem;
    }

    render() {
        this.domElem = $(this.template());
        this.rootElem.append(this.domElem);

        this._bind();
    }

    _bind() {
        this.domElem.find('.add-table').on('click', this._onAddTableClick.bind(this));
        this.domElem.find('.update-table').on('click', this._onUpdateTableClick.bind(this));
        this.domElem.find('.remove-table').on('click', this._onRemoveTableClick.bind(this));
    }

    _onAddTableClick(e) {
        // TODO: replace to forms, to use $.serialize() ;)
        const section = $(e.target).closest('.section');

        this._addTable(
            section.find('.table-id').val(),
            section.find('.table-name').val(),
            section.find('.table-participants-count').val()
        );
    }

    _onUpdateTableClick(e) {
        // TODO: replace to forms, to use $.serialize() ;)
        const section = $(e.target).closest('.section');

        this._updateTable(
            section.find('.table-id').val(),
            section.find('.table-name').val(),
            section.find('.table-participants-count').val()
        );
    }

    _onRemoveTableClick(e) {
        // TODO: replace to forms, to use $.serialize() ;)
        const section = $(e.target).closest('.section');

        this._removeTable(section.find('.table-id').val());
    }

    _addTable(afterID, name, participants) {
        EventBus.dispatch('add_table', {
            afterID: afterID,
            name: name,
            participants: participants
        });
    }

    _updateTable(id, name, participants) {
        EventBus.dispatch('update_table', {
            id: id,
            name: name,
            participants: participants
        });
    }

    _removeTable(id) {
        EventBus.dispatch('remove_table', {id: id});
    }

    template() {
        return `<div class="admin-board">
            <h1>Admin Board</h1>
            <div class="section add">
                <h2>Add</h2>
                <input type="text" class="table-id" placeholder="after id"/>
                <input type="text" class="table-name" placeholder="name"/>
                <input type="text" class="table-participants-count" placeholder="count"/>
                <button class="add-table">add table</button>
            </div>
            <div class="section update">
                <h2>Update</h2>
                <input type="text" class="table-id" placeholder="id"/>
                <input type="text" class="table-name" placeholder="name"/>
                <input type="text" class="table-participants-count" placeholder="count"/>
                <button class="update-table">update table</button>
            </div>
            <div class="section remove">
                <h2>Remove</h2>
                <input type="text" class="table-id" placeholder="id"/>
                <button class="remove-table">remove table</button>
            </div>
        </div>`;
    }
}
