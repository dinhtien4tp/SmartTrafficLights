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
			console.log(data);
		});
	}

	angular.element(document).ready(function() {
		$scope.time = arr[0];

		setInterval(function() {
			$scope.time--;
			socket.emit("update-vehicle", {dsa: "djksah dsjka"});
			if ($scope.time < 0){
				$scope.color = ($scope.color + 1) % 3;
				$scope.time = arr[$scope.color]; 
			}
			$scope.$apply();
		}, 1000);

	});
});
