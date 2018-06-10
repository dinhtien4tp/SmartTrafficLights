var nodeService = require("../services/node.service");
var _ = require("underscore");
var Q = require("q");
var random = function (a, b) {
	return Math.floor(Math.random() * (b - a)) + a;
}
function Node(_id, network) {
    var that = this;
    that.network = null;
    that.socket = null;
    that.nodeData = null;
    that.vehicles = {};
    that.time = 0;
    that.color = 0;
    that.index = 0;
    that.colors = {
        RED: 0,
        YELLOW: 2,
        GREEN: 1
    }
    function __init() {
        that._id = _id;
        that.network = network;
        nodeService.getById(_id)
            .then(function (data) {
                that.nodeData = data;
            })
            .catch(function (err) {
                that.nodeData = {};
                console.log(err);
            })

        setInterval(() => {
            var vehicle = {};
            var index = 0;
            for (var i in that.vehicles) {
                // Giảm thời gian tới của lượng phương tiện
                that.vehicles[i].map(function (e) { 
                    if (e.time > 0) {
                        e.time -= 1;
                    }
                    return e;
                });


                if ((that.color == that.colors.RED && index % 2 == 0) || (that.color != that.colors.RED && index % 2 == 1)) {
                    // duoc phep di chuyen
                    // Tong cac phuong tien chuan bi di qua den do
                    var sumVehicle = that.vehicles[i].filter((e) => { return e.time == 0}).map(e => e.num).reduce((a, b) => { return a + b; }, 0);
                    var delta = 0;
                    // luong phuong tien dang toi
                    that.vehicles[i] = that.vehicles[i].filter((e) => { return e.time > 0});

                    // chuyen luong phuong tien qua cac truc duong khac
                    for (var j in that.vehicles) {
                        // chuyen tiep phuong tien qua cac truc khac, tru chinh no
                        if (i != j) {
                            delta = random(0, sumVehicle);
                            sumVehicle -= delta;
                            that.network.network[j].newVehicle(i, delta);
                        }
                    }
                }
                vehicle[i] = that.vehicles[i].map(e => e.num).reduce((a, b) => { return a + b; }, 0);
                index += 1;
            };
            
            that.network.updateToAdmin(that.nodeData._id, {
                vehicle: vehicle,
                time: that.time,
                color: that.color
            });

            if (that.time == 1 && that.color != that.colors.GREEN) {
                var total = 0;
                if (that.color == that.colors.RED) {
                    var index = 0;
                    for (var i in that.vehicles) {
                        if (index % 2 == 0) {
                            total += that.vehicles[i].map(e => e.num).reduce((a, b) => { return a + b; }, 0);
                        }
                        index += 1;
                    }
                } else {
                    var index = 0;
                    for (var i in that.vehicles) {
                        if (index % 2 == 1) {
                            total += that.vehicles[i].map(e => e.num).reduce((a, b) => { return a + b; }, 0);
                        }
                        index += 1;
                    }
                }
                var newTime = 0;
                if (total < 50) {
                    newTime = random(10, 15);
                } else if (total < 100) {
                    newTime = random(20, 25);
                } else {
                    newTime = random(25, 35);
                }
                that.socket.emit("set next time", {time: newTime})
            }
        }, 1000)
    }
    __init();

    that.isConnected = function () {
        return that.__isConnected == true;
    }

    that.storeData = function (data) {
        var deferred = Q.defer();
        if (data.relation) {
            data.relation = [];
        }

        nodeService.create(data).then(() => {
            that.nodeData = data;
            deferred.resolve();
        }).catch((err) => {
            console.log(err);
            deferred.reject(err);
        })
            
        return deferred.promise;
    }

    that.getNodeData = function () {
        return that.nodeData;
    }

    that.updateData = function (data) {
        var deferred = Q.defer();
        data = _.omit(data, ["_id"]);
        
        nodeService.update(that.nodeData._id, data).then(() => {
            Object.assign(that.nodeData, data);
            deferred.resolve();
        }).catch((err) => {
            console.log(err);
            deferred.reject(err);
        })
        return deferred.promise;
    }

    that.newVehicle = function (from, num) {
        if (Array.isArray(that.nodeData.relation)) {
            for (var i in that.nodeData.relation) {
                if (that.nodeData.relation[i].idx == from) {
                    if (!that.vehicles[from]) 
                        that.vehicles[from] = [];
                    that.vehicles[from].push({time: random(20, 30), num: num})
                    break;
                }
            }
        }
    }

    that.setTime = function (data) {
        that.socket.emit("set time", data)
    }

    that.setSocket = function (socket, fn) {
        that.socket = socket;
        that.__isConnected = true;
        that.network.nodeConnected(that.nodeData._id);

        that.socket.on("update-vehicle", function (data) {
            that.time = data.time;
            that.color = data.color;
            that.network.updateVehicle(that.nodeData._id, data.vehicle);

            if (that.time == 1) {
                let keys = Object.keys(that.vehicles);
                if (keys.length == 4) {
                    
                }
            }
        });  
        
        that.socket.on("update node", function (nodeData, fn) {
            console.log(nodeData);
            fn({status: "OK"});
        })
        
        that.socket.on("disconnect", function () {
            that.network.nodeDisconnect(that.nodeData._id);
        });


        if (fn) {
            fn(that.nodeData);
        }
    }
}

module.exports = Node