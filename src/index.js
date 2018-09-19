import WsServer from 'tbrtc-server/src/server/WsServer';
import {Error} from 'tbrtc-common/messages/result/Error';
import "@babel/polyfill";
import Sequelize from "sequelize";
import uuidv4 from 'uuid/v4';

const sequelize = new Sequelize('rtctalker', 'rtctalker', 'rtctalker', {
    dialect: 'mysql',
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
    port: 9876,
    temporaryTime: 15,
    confirmType: 'creator',
});

server.on('server.started', (e) => {
    console.log('server.started');
});
server.on('user.checked', (e) => {
    const {user, message, sourceConnection} = e.data;
    Session.findOne({where: { user_id: e.data.user.id}}).then(session => {
        if(session === null && !message.user.token) {
            server.dispatch('user.checked.success', {user, sourceConnection, message});
        } else if(session === null || session.token !== message.user.token || session.validUntil.getTime() < (new Date()).getTime()) {
            server.dispatch('user.checked.failure', {sourceConnection, user, messageData: {code: Error.codes.PERM_REQ, details: {user: `${user.name} ${user.surname}`, action: 'login'}}});
        } else {
            server.dispatch('user.checked.success', {user, sourceConnection, message});
        }
    });
});
server.on('user.connected', (e) => {
    if(!!e.data.message.user.token) {
        Online.build({id: uuidv4(), user_id: e.data.user.id}).save().then(() => {
            console.log('user '+e.data.user.id+' is online');
        })
    }
});
server.on('user.disconnected', (e) => {
    console.log('user.disconnected: '+e.data.user.id);
    Online.findAll({where: { user_id: e.data.user.id}}).then(online => {
        online.forEach(singleOnline => {
            singleOnline.destroy();
        });
        console.log('user '+e.data.user.id+' is offline');
    });
});
/*server.on('connection.opened', (e) => {
    console.log('connection.opened');
});
server.on('connection.closed', (e) => {
    console.log('connection.closed');
});
server.on('session.created', (e) => {
    console.log('session.created');
    //console.log(e.data.session);
});
server.on('message.received', (e) => {
    console.log('message.received', e.data.message);
});
server.on('user.communication', (e) => {
    console.log('user.communication', e.data.message);
});*/

server.start();
