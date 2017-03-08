import Dataprovider from './Dataprovider';
import Dashboard from './Dashboard';
import AdminBoard from './AdminBoard';

export default class App {
    constructor(domElem) {
        this.domElem = domElem;
        this.$activity = $('.activity');
        this._lastPing = new Date();

        this._bind();
        Dataprovider.init();
    }

    _bind() {
        Dataprovider.on({
            open: this._onConnectionOpen,
            message: this._onMessage,
            'message:pong': this._onPong,
            'message:login_successful': this._onLoginSuccessful,
            'message:login_failed': this._onLoginFailed,
            'message:not_authorized': this._onNotAuthorized,
            error: this._onError
        }, this);
    }

    _ping() {
        const lastPing = new Date();
        const pingDelay = lastPing - this._lastPing;

        if (pingDelay > 1500) {
            this._removeActive();
        }

        this._lastPing = lastPing;

        Dataprovider.send({
            $type: 'ping',
            seq: 1
        });
    }

    _removeActive() {
        this.$activity.removeClass('active');
    }

    _setActive() {
        this.$activity.addClass('active');
    }

    _onConnectionOpen() {
        console.log('connected');

        // ping
        setInterval(() => this._ping(), 1000);

        // auth
        // TODO: must depend from ping status (?)
        Dataprovider.send({
            $type: 'login',
            username: 'user1234',
            password: 'password1234'
        });
    }

    _onMessage() {

    }

    _onPong() {
        this._setActive();
    }

    _onLoginSuccessful(data) {
        console.log('Login Succesful');
        const dashboard = new Dashboard(this.domElem);
        const adminboard = new AdminBoard(this.domElem);

        dashboard.render();

        if (data.user_type === 'admin') {
            adminboard.render();
        }

        Dataprovider.un('message:login_successful', this._onLoginSuccessful, this);
    }

    _onLoginFailed() {
        console.log('Login Failed!');
    }

    _onNotAuthorized() {
        console.log('Not Authorized!');
    }

    _onError() {
        console.log('onerror');
        console.log(res);
    }
}
