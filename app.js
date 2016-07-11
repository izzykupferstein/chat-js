var http = require ( 'http' );
var express = require ( 'express' );

var app = express ();
var server = http.createServer ( app ).listen ( 3000, '192.168.8.120' );

var io = require ( 'socket.io' ) ( server );

app.use ( express.static ( './' ));
app.get ( '/data-feed', function ( req, res ) {
	res.end ( JSON.stringify ( Data.get ()));
	console.log ( 'Request for data from [/data-feed].' );
});

io.on ( 'connection', function ( sock ) {
	var now = new Date ();
	sock.on ( 'new-user', function ( name ) {
		Users.create ( name );
		sock.broadcast.emit ( 'notif', `User <b>${ name }</b> has joined the chat.` );
		console.log ( `NOTIF: User '${ name }' created at \$\{users[${ users.length - 1 }]\}.` );
	});
	sock.on ( 'user-request', function ( req ) {
		sock.emit ( 'user-response', Users.getByName ( req.name ));
		console.log ( Users.getByName ( req.name ) );
	});
	sock.on ( 'request-data', function () {
		var ret_html = '';
		var dat = Data.get ();
		for ( var k in dat ) {
			ret_html += `
				<div class="message">
					<span class="date">${ dat[k].date }</span>
					<div class="avatar">${ dat[k].user[0].toUpperCase () }</div>
					<h3>${ dat[k].user }</h3>
					<p>${ dat[k].message }</p>
				</div>
			`;
		}
		sock.broadcast.emit ( 'response-data', ret_html );
		console.log ( 'NOTIF: Data pull requested.' );
	});
	sock.on ( 'notify-user-list', function () {
		console.log ( users );
	});
	sock.on ( 'chat', function ( res ) {
		if ( ! res.userid ) return false;
		var userName = Users.getById ( res.userid );
		data.push ({ user: userName, message: res.message, date: now.toUTCString ()});
		sock.broadcast.emit ( 'message', `
		<div class="message">
			<span class="date">${ now.toUTCString () }</span>
			<div class="avatar">${ userName[0].toUpperCase () }</div>
			<h3>${ userName }</h3>
			<p>${ res.message }</p>
		</div>
		` );
	});
	sock.on ( 'disconnect', function () {
		// remove user from var users
		sock.broadcast.emit ( 'notif', `A user has left the chat.` );
		console.log ( 'ALERT: User disconnected.' );
	});
});

console.log ( 'Starting socket server on port :3000' );

var data = [];
var users = [];

var Data = {
	get: function () {
		return data;
	},
	getByUserId: function () {},
	getByUserName: function () {},
	getInDateRange: function ( start, end ) {}
};

var Users = {
	get: function () {
		return users;
	},
	create: function ( name ) {
		users.push ( name );
	},
	getById: function ( id ) {
		return users[id];
	},
	getByName: function ( name, lastAdded ) {
		var ret_users_index = [];
		users.forEach ( function ( value, index ) {
			if ( value === name ) ret_users_index.push ( index );
		});
		if ( lastAdded ) return ret_users_index.length - 1;
		else return ret_users_index[0];
	}
};
