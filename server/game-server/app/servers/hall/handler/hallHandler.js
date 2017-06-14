var hallRemote = require('../remote/hallRemote');

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

/**
 * 取房间列表
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.rooms = function(msg, session, next) {
	var rid = session.get('rid');
	var username = session.uid.split('*')[0];
	var channelService = this.app.get('channelService');
	
	console.log(this.app.rpc);
	var rooms = hallRemote.getRooms(this.app);
	var param = {
		rooms: rooms
	};
	channel = channelService.getChannel(rid, false);
	var tuid = username + '*' + rid;
	var tsid = channel.getMember(tuid)['sid'];
	channelService.pushMessageByUids('dse_update_hall', param, [{
		uid: tuid,
		sid: tsid
	}]);
	next(null, {
		rooms: rooms
	});
};

/*
 * 加入房间
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
*/
handler.enter_room = function(msg, session, next) {
	var rid = parseInt(msg.rid);	// 要加入的房间号
	var username = session.uid.split('*')[0];
	if (isNaN(rid)) {
		var error = "invaild rid!";
		console.error(error);
		next(null, {
			code: 1,
			error: error
		});
		return;
	}
	var rooms = hallRemote.getRooms(this.app);
	var room = rooms[rid];
	if (room.isFull()) {
		// 房间人满
		var error = "room is full!";
		console.error(error);
		next(null, {
			code: 2,
			error: error
		});
		return;
	}
	session.set('rid', msg.rid);	// 修改玩家房间号
	next(null, {
		code: 0,
		room: room
	});

};