var nodeService = require('../services/node.service');
var Node = require("./node.model");
var ObjectId = require('mongodb').ObjectID;

var CONST = {
    OK: 1,
    ERR: 0
}

function Network (io) {
    this.network = {};
    this.io = io;
    var that = this;

    function __init() {
        nodeService.getAll()
            .then(function (nodes) {
                that.nodes = {};
                that.devices = {};
                for (var e in nodes) {
                    let _id = nodes[e]._id.toString()
                    that.network[_id] = new Node(_id, that);
                }

                io.of("/admin").on('connection', function(socket, next) {
                    console.log("Admin connected");
                    for (var e in that.network) {
                        that.nodes[e] = that.network[e].getNodeData();
                        that.devices[e] = that.network[e].isConnected();
                    }

                    socket.emit("receive-data", {nodes: that.nodes, devices: that.devices}, function () {

                    });

                    socket.on("save-node", function (nodeData, fn) {
                        if (nodeData._id === undefined){
                            nodeData._id = new ObjectId();
                            let _id = nodeData._id.toString();
                            that.network[_id] = new Node(_id, that);
                            that.network[_id].storeData(nodeData)
                                .then(function (data) {
                                    fn({status: CONST.OK, _id: _id});
                                })
                                .catch(function (Err) {
                                    console.log(Err);
                                    fn({status: CONST.ERR});
                                })
                        } else {
                            that.network[nodeData._id.toString()].updateData(nodeData)
                                .then(function (data) {
                                    fn({status: CONST.OK});
                                })
                                .catch(function (Err) {
                                    console.log(Err);
                                    fn({status: CONST.ERR});
                                })
                        }
                    });

                    socket.on("update time", function (data) {
                        that.network[data._id.toString()].setTime(data.time);
                    })
                });

                io.of("/node").on('connection', function(socket, next) {
                    socket.on("init-node", function (data, fn) {
                        that.network[data._id].setSocket(socket, fn);
                    })
                });

                // setInterval(() => {
                //     "update vehicle"
                // }, 1000);
            })
            .catch(function (err) {
                console.log(err);
            })
    }
    __init();

    this.nodeConnected = function (_id) {
        io.of("/admin").emit("device connected", {idx: _id, status: true});
    }

    this.nodeDisconnect = function (_id) {
        io.of("/admin").emit("device connected", {idx: _id, status: false});
    }
    this.updateVehicle = function (from, data) {
        for (var _id in data) {
            that.network[_id].newVehicle(from, data[_id]);
        }
    }
    this.updateToAdmin = function (_id, data) {
        io.of("/admin").emit("update node data", {idx: _id, data: data});
    }
}


module.exports = Network