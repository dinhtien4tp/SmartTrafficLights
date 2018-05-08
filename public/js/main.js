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
			tempdata: {
				saved: false,
			}
		}
		$scope.nodes[(new Date()).getTime()] = node;
		gmap.create_node ($scope, idx);
	}
	$scope.save_node = function (idx) {
		t = idx;
		if ($scope.nodes[idx]._id === undefined) {
			if (idx == 0) {
				idxs.push(idx);
			} else {
				if ($scope.nodes[idx - 1]._id === undefined) {
					while ($scope.nodes[t - 1]._id === undefined) t--;
					// swap all data
					temp = $scope.nodes[t];
					$scope.nodes[t] = $scope.nodes[idx];
					$scope.nodes[idx] = temp;
					// update idx
					$scope.nodes[idx]._id = idx;
					$scope.nodes[t]._id = t;
					// update marker
					gmap.update_node($scope.nodes[idx]);
					gmap.update_node($scope.nodes[t]);
					// push t to waitting saved
					idxs.push(t);
				} else {
					idxs.push(idx);
				}
			}
		}
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
		socket.emit("update time", {node_id: $scope.current_node, time: (red + "#" + green)});
		console.log("settime");
	}

	socket.on("receive-data", function (data, callback) {

		$scope.nodes = data.nodes;
		$scope.devices = data.devices;
		toastr.success("Receive " + data.nodes.length + " nodes", "Successful");

		for (var e in $scope.nodes) {
			gmap.update_map($scope);
			cy.initialize($scope, toastr);
		}
		
		for (var e in $scope.devices){
			$scope.connecteds[$scope.devices[e]] = {};
			$scope.connecteds[$scope.devices[e]].connected = true;
		}

		toastr.success(data.devices.length + " nodes is connected", "Successful");
		toastr.success("Initialize completed", "Successful");
		
		callback({msg: "OKE"});
	});
	
	socket.on("update node", function (node) {
		idx = idxs.indexOf(node._id);

		if (idx >= 0) {
			$scope.nodes[node._id] = node;
			gmap.update_node($scope.nodes[node._id]);
			cy.create_node($scope, node._id);

			idxs.splice(idx, 1);
			toastr.success("Add node completed", "Successful");
		} else {
			if ($scope.nodes[node._id] !== undefined && $scope.nodes[node._id]._id !== undefined) {
				// node add by current user
				$scope.nodes[node._id] = node;
				gmap.update_node($scope.nodes[node._id]);
				cy.update_node($scope, node._id);
				toastr.warning("Node " + node.name + " update", "Warning");
			} else {
				if ($scope.nodes[node._id] === undefined) {
					$scope.nodes[node._id] = node;
					gmap.create_node($scope, node._id);
					cy.create_node($scope, node._id);
				} else {
					// move node had the same idx to the end of array
					$scope.nodes[node._id]._id = $scope.nodes.length;
					$scope.nodes.push($scope.nodes[node._id]);
					gmap.create_node($scope, $scope.nodes[node._id]._id);
					cy.create_node($scope, $scope.nodes[node._id]._id);
					// update node had the same idx
					$scope.nodes[node._id] = node;
					gmap.update_node($scope.nodes[node._id]);
					cy.create_node($scope, node._id);
				}
				toastr.info("Add new node by another user", "Info");
			}
		}
	});
	
	socket.on("device connected", function(data) {
		console.log(data, $scope.nodes[data.idx]);
		if (data.status) {
			toastr.info("Node " + $scope.nodes[data.idx].name + " is connected", "Info");
			cy.node_connect(data.idx, true);
			$scope.devices.push(data.idx);

			$scope.connecteds[data.idx] = {};
			$scope.connecteds[data.idx].connected = true;
		} else {
			toastr.warning("Node " + $scope.nodes[data.idx].name + " is disconnected", "Warning");
			cy.node_connect(data.idx, false);
			$scope.devices.splice($scope.devices.indexOf(data.idx));
			$scope.connecteds[data.idx].connected = false;
		}
	});

	socket.on("update waitime", function(data) {
		if ($scope.nodes[data.idx] == undefined)
			return;
		$scope.connecteds[data.idx].data = data;

	});

	socket.on("update vehicle", function (edges) {
		cy.update_vehicle(edges);
	});

	angular.element(document).ready(function() {
		gmap = new GoogleMaps(toastr);
		cy = new Cy();

		gmap.add_map_listener($scope);

		div_main = angular.element("#main");
	});
});
