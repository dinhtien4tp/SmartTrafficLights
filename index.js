
/*
	Admin will control server by socketio
*/
var express = require('express');
var ObjectId = require('mongodb').ObjectID;
var app = express();

app.use('/public', express.static(__dirname + '/public/'));
app.use('/node_modules', express.static(__dirname + '/node_modules/'));
app.use('/directives', express.static(__dirname + '/node_modules/angular-toastr/src/directives/'));


var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var Network = require("./models/network.model");

var network = new Network(io);
server.listen(process.env.PORT || 3000);
console.log("Starting server on: " + (process.env.PORT || 3000));

app.get("/", function (req, res) {
	res.sendFile(__dirname + "/pages/vis.html");
});
app.get("/node", function (req, res) {
	res.sendFile(__dirname + "/pages/node.html");
});



/*
	Admin will control server by socketio

var express = require('express');
var ObjectId = require('mongodb').ObjectID;
var app = express();

app.use('/public', express.static(__dirname + '/public/'));
app.use('/node_modules', express.static(__dirname + '/node_modules/'));
app.use('/directives', express.static(__dirname + '/node_modules/angular-toastr/src/directives/'));


var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var node_collection = require('./public/js/node.service');

io.set('log level', 2);

connections = [];
nodes = [];
devices = [];

node_collection.get_all(function(data) {
	nodes = data;
	for (var i = 0; i < nodes.length; i++) {
		nodes[i].tempdata.idx = i;
		nodes[i].tempdata.saved = true;
	}
	io.sockets.emit("receive data", {nodes: nodes, devices: devices}, function (data) {
		console.log(data.msg);
	});
});



server.listen(process.env.PORT || 3000);
console.log("Starting server on: " + (process.env.PORT || 3000));

app.get("/", function (req, res) {
	res.sendFile(__dirname + "/pages/vis.html");
});
app.get("/node", function (req, res) {
	res.sendFile(__dirname + "/pages/node.html");
});


// connect to server
io.sockets.on('connection', function(socket, next) {
	socket.idx = connections.length;
	connections.push(socket);
	console.log("Admin connected");

	socket.on("update time", function (data) {
		for (var i = 0; i < stls.length; i++) {
			if (stls[i].node_id == data.node_id) {
				stls[i].send (data.time);
				console.log("Setting time:" + data.time);
				break;
			}
		}
	});

	socket.emit("receive data", {nodes: nodes, devices: devices}, function (data) {
		
	});

	socket.on('disconnect', function (data) {
		connections.splice(socket.idx, 1);
		console.log("Admin disconnected");
	});
});




/*
	Node will control by websocketio
*/


/*
led = {
	high: 35,
	medium: 25,
	low: 15,
};

var ws = require('websocket.io');
var http = require('http').createServer(express()).listen(4567);
var node = ws.attach(http);

console.log("Node start on port: " + 4567);




function add_vehicle (node_idx, veh, color) {
	for (var i = 0; i < nodes[node_idx].relation.length; i++) {
		to = nodes[node_idx].relation[i].idx;
		for (var j = 0; j < nodes[to].relation.length; j++) {
			if (nodes[to].relation[j].idx == node_idx) {
				if (nodes[to].relation[j].vehicle == "")
					nodes[to].relation[j].vehicle = [];
				vehicle = 0;
				if (color == true) {
					vehicle = veh * nodes[to].relation[j].probability.red;
				} else {
					vehicle = veh * nodes[to].relation[j].probability.green;
				}
				// console.log(vehicle);
				time = nodes[to].relation[j].distance / nodes[to].relation[j].speed * 60;
				// console.log("Node " + nodes[to].name + " sau " + time + "s se co " + vehicle + " phuong tien di toi");
				nodes[to].relation[j].vehicle.push({time: time, vehicle: Math.ceil(vehicle)});
				break;
			}
		}
	}
}
function update_probability (node_idx, veh, color) {
	start = 0;
	if (color == true) start = 1;
	sum = 0;
	count = 0;
	for (var i = start; i < nodes[node_idx].relation.length; i += 2) {
		if (nodes[node_idx].relation[i].vehicle[0] !== undefined && nodes[node_idx].relation[i].vehicle[0].time <= 0) {
			sum += nodes[node_idx].relation[i].vehicle[0].vehicle;
			count++;
		}
	}
	if (count == 0) {
		return;
	}

	for (var i = start; i < nodes[node_idx].relation.length; i += 2) {
		if (nodes[node_idx].relation[i].vehicle[0] !== undefined && nodes[node_idx].relation[i].vehicle[0].time == 0) {
			nodes[node_idx].relation[i].vehicle[0].vehicle = veh / count;
			if (color == true) {
				nodes[node_idx].relation[i].probability.red = (nodes[node_idx].relation[i].probability.red + veh / sum) / 2;
			} else {
				nodes[node_idx].relation[i].probability.green = (nodes[node_idx].relation[i].probability.red + veh / sum) / 2;
			}
		}
	}
}



stls = [];
node.on('connection', function (socket) {
	socket.stl_idx = stls.length;
	stls.push (socket);

  	socket.on('message', function (data) { 
  		try {
  			obj = JSON.parse(data);
  			if (obj._id !== undefined) {
  				for (var i = 0; i < nodes.length; i++) {
  					if (nodes[i]._id == obj._id) {

						socket.idx = devices.length;
						if (devices.indexOf(i) == -1)
							devices.push(i);

  						socket.node_id = i;
  						io.sockets.emit ("device connected", {idx: i, status: true});
  						break;
  					}
  				}
  			} else if (obj.color !== undefined && obj.time !== undefined) {
  				io.sockets.emit ("update waitime", {time: obj.time, color: obj.color, idx: socket.node_id});
  				edges = [];

  				if (obj.color == 0 && obj.time == 3) {
  					sum1 = 0;
  					sum2 = 0;
  					node_idx = socket.node_id;

					for (var i = 0; i < nodes[node_idx].relation.length; i++) {
						if (!nodes[node_idx].relation[i].vehicle[0])
							continue;
						if (i % 2 == 0) {
							sum1 += nodes[node_idx].relation[i].vehicle[0].vehicle / nodes[node_idx].relation[i].capacity;
						} else {
							sum2 += nodes[node_idx].relation[i].vehicle[0].vehicle / nodes[node_idx].relation[i].capacity;
						}
					}
					function get_time(time) {
						if (time > 3)
							return led.high;
						if (time > 2)
							return led.medium;

						return led.low;
					}
					console.log(sum1 + "#" + sum2);

					sum1 = get_time (sum1 / 2);
					sum2 = get_time (sum2 / 2);

					console.log({red: sum1, green: sum2});
					socket.send(sum1 + "#" + sum2);
  				}

  				for (var i = 0; i < nodes[socket.node_id].relation.length; i++) {
  					try {
  						sum = 0;
  						for (var j = 0; j < nodes[socket.node_id].relation[i].vehicle.length; j++) {
  							if (nodes[socket.node_id].relation[i].vehicle[j].time <= 0) {
  								// console.log("Gap den do", j);
  								if (obj.color != 0) {
  									vehicle = nodes[socket.node_id].relation[i].vehicle[j].vehicle;
  									add_vehicle (socket.node_id, vehicle, obj.color);
	  								nodes[socket.node_id].relation[i].vehicle.splice(j, 1);
	  								j--;
	  								// console.log("chuyen tiep sang node khac");
	  								continue;
	  							} else {
	  								if (j >= 1) {
	  									nodes[socket.node_id].relation[i].vehicle[0].vehicle += Math.ceil(nodes[socket.node_id].relation[i].vehicle[j].vehicle);
	  									nodes[socket.node_id].relation[i].vehicle.splice(j, 1);
	  									j--;
	  									// console.log("Da cong don len "+ nodes[socket.node_id].relation[i].vehicle[0].vehicle);
	  								}
	  							}
  							} else {
  								nodes[socket.node_id].relation[i].vehicle[j].time--;
  							}
  							sum += nodes[socket.node_id].relation[i].vehicle[j].vehicle;
  						}
  						edges.push({vehicle: sum, from: socket.node_id, to: nodes[socket.node_id].relation[i].idx});
  					} catch (ex) {
  						console.log(ex);
  					}
  				}
  				io.sockets.emit ("update vehicle", edges);
  			} else if (obj.vehicle !== undefined && obj.color !== undefined) {
  				if (obj.color == 0) {
  					update_probability (socket.node_id, obj.vehicle, obj.color);
  				}
  				add_vehicle (socket.node_id, obj.vehicle, obj.color);
  			}
  		} catch (ex) {
  			console.log(data, ex);
  		}
  	});
  	socket.on('close', function () {
		io.sockets.emit ("device connected", {idx: socket.node_id, status: false});
  		console.log("disconnect device: ", {idx: socket.node_id});
		connections.splice(socket.idx, 1);
		stls.splice(stls.indexOf(socket.stl_idx), 1);
  	});
});

*/