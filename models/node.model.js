var nodeService = require("../services/node.service");


function Node(_id, network) {
    var that = this;
    that.network = null;
    that.socket = null;
    that.nodeData = null;

    function __init() {
        that._id = _id;
        that.network = network;
        nodeService.getById(_id)
            .then(function (data) {
                that.nodeData = data;
            })
            .catch(function (err) {
                console.log(err);
            })
    }
    __init();

    that.isConnected = function () {
        return that.__isConnected == true;
    }

    that.getNodeData = function () {
        return that.nodeData;
    }

    that.updateData = function (data) {
        that.nodeData = data;
    }

    that.setSocket = function (socket, fn) {
        that.socket = socket;
        that.__isConnected = true;
        that.network.nodeConnected(that.nodeData._id);

        that.socket.on("update-vehicle", function (data) {
            // console.log(data, that.nodeData._id);
        });          
        that.socket.on("disconnect", function () {
            that.network.nodeDisconnect(that.nodeData._id);
        });


        if (fn) {
            fn(that.nodeData);
        }
    }
}

module.exports = Node