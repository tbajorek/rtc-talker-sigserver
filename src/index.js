import WsServer from 'tbrtc-server/src/server/WsServer';
import {Error} from 'tbrtc-common/messages/result/Error';
import "@babel/polyfill";
import Sequelize from "sequelize";
import uuidv4 from 'uuid/v4';

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    define: {
        timestamps: false
    }
});

const Session = sequelize.define('sessions', {
    id: { type: Sequelize.STRING, primaryKey: true },
    user_id: Sequelize.STRING,
    token: Sequelize.STRING,
    validUntil: Sequelize.DATE
});

const Online = sequelize.define('online', {
    id: { type: Sequelize.STRING, primaryKey: true },
    user_id: Sequelize.STRING
}, {
    tableName: 'online'
});

const server = new WsServer({
    port: process.env.SIG_PORT,
    temporaryTime: 15,
    confirmType: 'creator',
});

server.on('server.started', (e) => {
    console.log('Serwer został uruchomiony');
});
server.on('user.checked', (e) => {
    const {user, message, sourceConnection} = e.data;
    Session.findOne({where: { user_id: e.data.user.id}}).then(session => {
        if(session === null && !user.token) {
            server.dispatch('user.checked.success', {user, sourceConnection, message});
        } else if(session === null || session.token !== user.token || session.validUntil.getTime() < (new Date()).getTime()) {
            server.dispatch('user.checked.failure', {sourceConnection, user, messageData: {code: Error.codes.PERM_REQ, details: {user: `${user.name} ${user.surname}`, action: 'login'}}});
        } else {
            server.dispatch('user.checked.success', {user, sourceConnection, message});
        }
    });
});
server.on('user.connected', (e) => {
    if(!!e.data.user.token) {
        const user_id = e.data.user.id;
        Online.build({id: uuidv4(), user_id}).save().then(() => {
            console.log('Użytkownik '+user_id+' został połączony');
        })
    }
});
server.on('user.communication', (e) => {
    console.log(e);
});
server.on('user.disconnected', (e) => {
    console.log('Użytkownik : '+e.data.user.id + ' został rozłączony');
    Online.findAll({where: { user_id: e.data.user.id}}).then(online => {
        online.forEach(singleOnline => {
            singleOnline.destroy();
        });
        console.log('Sesja użytkownika '+e.data.user.id+' jest usunięta z bazy');
    });
});


server.start();