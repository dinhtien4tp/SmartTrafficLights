var app = angular.module('node', []);
app.factory('socket', function($rootScope) {
	var socket = io("/node");
	return {
		on: function(eventName, callback) {
			socket.on(eventName, function() {
				var args = arguments;
				$rootScope.$apply(function() {
					callback.apply(socket, args);
				});
			});
		},
		emit: function(eventName, data, callback) {
			socket.emit(eventName, data, function() {
				var args = arguments;
				$rootScope.$apply(function() {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		}
	};
})

var data = null;
var arr_data;
var stt = false;
var arr = [15, 15, 3];

var random = function (a, b) {
	return Math.floor(Math.random() * (b - a)) + a;
}

app.controller('main-controller', function($scope, socket) {
	$scope.node = {};
	$scope.node._id = window.location.href.split("=").pop();
	$scope.btn_status = "Connect";
	
	$scope.connect = function () {
		socket.emit("init-node", {_id: $scope.node._id}, function (data) {
			$scope.node = data;
		});
		socket.on("set time", function (data) {
			arr[0] = data.red || 15;
			arr[1] = data.green || 15;
		})
		socket.on("set next time", function (data) {
			if ($scope.color == 0) {
				arr[1] = data.time - 3;
			} else if ($scope.color == 2) {
				arr[0] = data.time;
			}
		})
	}
	
	angular.element(document).ready(function() {
		$scope.time = arr[0];
		$scope.color = 0;
		
		setInterval(function() {
			$scope.time--;
			if ($scope.time <= 0){
				$scope.color = ($scope.color + 1) % 3;
				$scope.time = arr[$scope.color];
			}
			let vehicle = {};
			for (var e in $scope.node.relation) {
				if ($scope.color == 0) {
					if (e % 2 == 0) {
						vehicle[$scope.node.relation[e].idx] = random(0, 10);
					} else {
						vehicle[$scope.node.relation[e].idx] = 0;
					}
				} else {
					if (e % 2 == 1) {
						vehicle[$scope.node.relation[e].idx] = random(0, 10);
					} else {
						vehicle[$scope.node.relation[e].idx] = 0;
					}
				}
			}
			
			socket.emit("update-vehicle", {vehicle: vehicle, time: $scope.time, color: $scope.color});
			$scope.$apply();
		}, 1000);

	});
});
