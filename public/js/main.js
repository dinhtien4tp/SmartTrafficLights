var app = angular.module('stl', ["ui.router", 'ngAnimate', 'toastr']);


app.factory('socket', function ($rootScope) {
  	var socket = io.connect("/admin");
  	return {
	    on: function (eventName, callback) {
	      	socket.on(eventName, function () {  
	        	var args = arguments;
	        	$rootScope.$apply(function () {
	          		callback.apply(socket, args);
	        	});
	      	});
	    },
	    emit: function (eventName, data, callback) {
	      	socket.emit(eventName, data, function () {
		        var args = arguments;
		        $rootScope.$apply(function () {
		          	if (callback) {
		            	callback.apply(socket, args);
		          	}
		        });
	      	})
	    }
  	};
});
app.config(function(toastrConfig) {
  	angular.extend(toastrConfig, {
	    autoDismiss: true,
		positionClass: 'toast-bottom-right',
		templates: {
			toast: '/directives/toast/toast.html'
		}
  	});
});

var div_main = null;

app.controller('main-controller', function($scope, $timeout, socket, toastr) {
	var cy = null;
	var gmap = null;
	var idxs = [];
	$scope.connecteds = {};
	$scope.nodes = [];
	$scope.add_node = false;


	$scope.fit = function () {
		gmap.fit();
		cy.fit();
	};

	$scope.start_add = function () {
		$scope.add_node = true;
		$scope.start = false;
		toastr.info("Add node begin", "Info");
		toastr.info("Right click on map to exit", "Info");
	}
	$scope.add_complete = function () {
		if (!$scope.start) {
			$scope.add_node = false;
			$scope.start = true;
			toastr.success("Add node completed", "Successful");
		}
	}
	$scope.create_node = function (position) {
		node = {
			position : {
				x: position.x,
				y: position.y,
			},
			address: position.address,
			relation: [],
			name: "",
			code: "",
			capacity: 0,
			saved: true
		}
		socket.emit("save-node", node, function (data) {
			if (data.status == 1) {
				node._id = data._id;
				$scope.nodes[data._id] = node;
				gmap.create_node ($scope, data._id);
			} else {
				toastr.error("Error", "Error");
			}
		})
	}

	$scope.save_node = function (idx) {
		$scope.nodes[idx].saved = true;
		socket.emit("save-node", $scope.nodes[idx], function (data) {
			if (data.status == 1) {
				gmap.update_node($scope.nodes[idx]);
				toastr.success("Update completed", "Successful");
			} else {
				$scope.nodes[idx].saved = false;
				toastr.error("Update data error", "Error");
			}
		})
	}
	$scope.node_option = function(idx) {
		gmap.set_node(idx);
		$scope.current_node = idx;
		angular.element("#node_option").modal();
		$scope.$apply();
	}
	$scope.select_relation = function() {
		gmap.set_select(true, $scope);
	}
	$scope.set_relation = function(i, r_i, b, data) {
		if (i == r_i)
			return;
		if (b) {
			$scope.nodes[i].relation.push({
				idx: r_i,
				speed: 50000, 
				distance: data.distance,
				probability: {
					red: 0.25,
					green: 0.25,
				},
			});
		} else {
			for (var idx = 0; $scope.nodes[i].relation.length; idx++) {
				if ($scope.nodes[i].relation[idx].idx == r_i) {
					$scope.nodes[i].relation.splice(idx, 1);
					break;
				}
			}
		}
		gmap.set_relation(i, r_i, b);
	}

	$scope.save_edge = function (from, to) {
		for (var i = 0; i < $scope.nodes[from].relation.length; i++) {
			if ($scope.nodes[from].relation[i].idx == to) {
				$scope.nodes[from].relation[i].capacity = prompt("Capacity", $scope.nodes[from].relation[i].capacity);
				if ($scope.nodes[from].relation[i].capacity == null)
					return;
				break;
			}
		}
		$scope.save_node(from);
	}

	$scope.set_time = function () {
		red = prompt ("RED", 15);
		green = prompt ("GREEN", 15);
		if (red == null || green == null)
			return;

		socket.emit("update time", {_id: $scope.current_node, time: {red: red, green: green}});
	}

	socket.on("receive-data", function (data, callback) {
		$scope.nodes = data.nodes;
		$scope.devices = data.devices;
		for (var e in $scope.nodes) {
			if ($scope.nodes[e].tempdata == undefined) {
				$scope.nodes[e].tempdata = {};
			}
		}
		toastr.success("Receive " + Object.keys(data.nodes).length + " nodes", "Successful");

		gmap.update_map($scope);
		cy.initialize($scope, toastr);
		
		for (var e in $scope.devices){
			if ($scope.devices[e]) {
				$scope.connecteds[e] = {};
				$scope.connecteds[e].connected = true;
			}
		}

		toastr.success(Object.keys(data.devices).length + " nodes is connected", "Successful");
		toastr.success("Initialize completed", "Successful");
		
		callback({msg: "OKE"});
	});
	
	
	socket.on("device connected", function(data) {
		if (data.status) {
			toastr.info("Node " + $scope.nodes[data.idx].name + " is connected", "Info");
			cy.node_connect(data.idx, true);
			$scope.devices[data.idx] = true;

			$scope.connecteds[data.idx] = {};
			$scope.connecteds[data.idx].connected = true;
		} else {
			toastr.warning("Node " + $scope.nodes[data.idx].name + " is disconnected", "Warning");
			cy.node_connect(data.idx, false);
			$scope.devices[data.idx] = false;
			$scope.connecteds[data.idx].connected = false;
		}
	});

	socket.on("update waitime", function(data) {
		if ($scope.nodes[data.idx] == undefined)
			return;
		$scope.connecteds[data.idx].data = data;

	});

	socket.on("update node data", function (nodeData) {
		if ($scope.connecteds[nodeData.idx]) {
			$scope.connecteds[nodeData.idx].data = {
				color: nodeData.data.color,
				time: nodeData.data.time
			}
			console.log(nodeData.data.color, nodeData.data.time, nodeData.data.vehicle);
			var vehicle = nodeData.data.vehicle;
			for (var to in vehicle) {
				cy.update_vehicle(to, nodeData.idx, vehicle[to]);
			}
		}
	});

	angular.element(document).ready(function() {
		gmap = new GoogleMaps(toastr);
		cy = new Cy();

		gmap.add_map_listener($scope);

		div_main = angular.element("#main");
	});
});
