var app 	= angular.module('nodes', []);

app.factory('socket', function ($rootScope) {
  	var socket = io.connect();
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

app.controller('main-controller', function($scope, socket) {


	socket.on("get info", function(data, fn) {
		fn({type: 2});
	});



});