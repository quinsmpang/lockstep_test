
var userDao = require("../../../dao/userDao");

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
		this.app = app;
};

var handler = Handler.prototype;

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function(msg, session, next) {
	var self = this;
	checkUserInfo(msg.username, msg.password, function(err) {
		if(err) {
			console.error("check user info failed!");
			return;
		}
		var rid = msg.rid;
		var uid = msg.username + '*' + rid
		var sessionService = self.app.get('sessionService');

		//duplicate log in
		if( !! sessionService.getByUid(uid)) {
			next(null, {
				code: 500,
				error: true
			});
			return;
		}

		session.bind(uid);
		session.set('rid', rid);
		session.push('rid', function(err) {
			if(err) {
				console.error('set rid for session service failed! error is : %j', err.stack);
			}
		});
		session.on('closed', onUserLeave.bind(null, self.app));

		//put user into channel
		self.app.rpc.chat.chatRemote.add(session, uid, self.app.get('serverId'), rid, true, function(users){
			next(null, {
				users:users
			});
		});
	})
};

var checkUserInfo = function(username, password, cb) {
	userDao.getUserInfo(username, password, function(err, userInfo) {
		console.log("userInfo", userInfo);
		if (err) {
			cb(err);
			return;
		}
		if (userInfo.uid == 0) {
			err = "no user!";
			cb(err);
			return;
		}
		if (userInfo.password != password) {
			err = "password err!";
			cb(err);
			return;
		}
		cb();
	});
}

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
	if(!session || !session.uid) {
		return;
	}
	app.rpc.chat.chatRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};