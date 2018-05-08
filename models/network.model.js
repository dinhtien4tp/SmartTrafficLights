var nodeService = require('../services/node.service');
var Node = require("./node.model");

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
                            let _id = nodeData._id.toString();
                            nodeData._id = new ObjectId();
                            that.network[_id] = new Node(_id, that);
                        } else {
                            nodeService.update(nodeData._id, nodeData)
                                .then(function (data) {
                                    that.network[nodeData._id.toString()].updateData(nodeData);
                                })
                                .catch(function (Err) {
                                    console.log(Err);
                                })
                        }
                        fn({status: true});
                        socket.emit("update node", nodeData);
                    });
                });

                io.of("/node").on('connection', function(socket, next) {
                    socket.on("init-node", function (data, fn) {
                        that.network[data._id].setSocket(socket, fn);
                    })
                });
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
}


module.exports = Network