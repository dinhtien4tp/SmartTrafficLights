function GoogleMaps(toastr) {

	var map = null;
	var geocoder = new google.maps.Geocoder();
	var directionsService = new google.maps.DirectionsService;
	var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true, preserveViewport: true});
	var toastr = toastr;


	var markers = {};
	var select = false;
	var node_select = -1;

	var icons = {
		unsaved: "/public/image/unsaved.png",
		saved: "/public/image/saved.png",
		friend: "/public/image/friend.png",
		not_friend: "/public/image/not-friend.png",
	}
	this.set_node = function (_id) {
		node_select = _id;
	}
	this.set_select = function(b, $scope) {
		console.log(b);
		select = b;
		$scope.nodes[node_select].saved = false;
		for (var i in $scope.nodes){
			if (i == node_select) {

			} else {
				if ($scope.nodes[node_select].relation) {		
					var j = 0;
					for (j = 0; j < $scope.nodes[node_select].relation.length; j++) {
						if (i == $scope.nodes[node_select].relation[j].idx) {
							markers[i].setIcon(icons.friend);
							break;
						}
					}
					if (j === $scope.nodes[node_select].relation.length) {
						markers[i].setIcon(icons.not_friend);
					}
					if (!$scope.nodes[i].saved) {
						markers[i].setIcon(icons.unsaved);
					}
				}
			}
			markers[i].setDraggable(false);
		}
	}

	this.un_select = function ($scope) {
		for (var _id in $scope.nodes){
			markers[_id].setDraggable(true);
			if ($scope.nodes[_id].saved) {
				markers[_id].setIcon(icons.saved);
			} else {
				markers[_id].setIcon(icons.unsaved);
			}
		}
		select = false;
	}
	var un_select_func = this.un_select;
	
	this.set_relation = function (i, _id, b) {
		if (b) {
			markers[_id].setIcon(icons.friend);
		} else {
			markers[_id].setIcon(icons.not_friend);
			directionsDisplay.setMap(null);
		}
	}
	
	this.__init = function () {
		if (map === null) {
		    var myLatLng = {lat: 21.037528, lng: 105.836028};

		    map = new google.maps.Map(document.getElementById('map'), {
		        scrollwheel: true,
		        zoom: 5,
		        center: myLatLng
		    });

		    directionsDisplay.setMap(map);
		}
	}

	this.add_map_listener = function ($scope) {
	    map.addListener('click', function(e) {
	    	if ($scope.start == false) {
	            geocoder.geocode({ 'latLng': e.latLng }, function (results, status) {
	                if (status == google.maps.GeocoderStatus.OK) {
	                	var address = "";
	                	if (results[0]) {
	        				address = results[0].formatted_address;
	        			}
						$scope.create_node({x: e.latLng.lat(), y: e.latLng.lng(), address: address});
	                }
	            });
			}
		});
		map.addListener('rightclick', function(e) {
	    	$scope.add_complete();
		});
	}
	this.fit = function () {
		bounds = new google.maps.LatLngBounds();
		for (var i in markers) {
			bounds.extend(markers[i].position);
		}

	    map.fitBounds(bounds);
	}
	this.update_node = function(data) {
		if (markers[data._id]) {
			var latlng = new google.maps.LatLng(data.position.x, data.position.y);
			markers[data._id].setPosition(latlng);
			if (data.saved) {
				markers[data._id].setIcon(icons.saved);
			} else {
				markers[data._id].setIcon(icons.unsaved);
			}
			markers[data._id].setTitle(data.name);
		}
	}

	this.create_node = function ($scope, i) {
		if ($scope.nodes[i] === undefined)
			return;

    	config = {
            position: new google.maps.LatLng($scope.nodes[i].position.x, $scope.nodes[i].position.y),
            map: map,
            title: $scope.nodes[i].name,
            draggable: true,
            idx: i,
        };
        if ($scope.nodes[i].tempdata == undefined || $scope.nodes[i].saved){
        	config.icon = icons.saved;
        }
        else {
        	config.icon = icons.unsaved;
        }
        var marker = new google.maps.Marker(config);

        (function(marker, $scope) {
        	marker.idx = marker.idx;
            google.maps.event.addListener(marker, 'dragend', function() {
            	if (select == true) {
            		return;
            	}
            	$scope.nodes[marker.idx].saved = false;
                markers[marker.idx].setIcon(icons.unsaved);

                var lat, lng, address;
                geocoder.geocode({ 'latLng': marker.getPosition() }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                    	$scope.nodes[marker.idx].position.x = marker.getPosition().lat();
                    	$scope.nodes[marker.idx].position.y = marker.getPosition().lng();
                    	$scope.nodes[marker.idx].address = results[0].formatted_address;
                    } else {
                    	alert("Error. Reload page please!!!");
                    }
                });
            });
            google.maps.event.addListener(marker, 'click', function() {
            	if (select == false) {	
	            	if($scope.nodes[marker.idx].saved == true) {
	            		$scope.node_option(marker.idx);
	            		node_select = marker.idx;
	            	} else {
	            		$scope.save_node(marker.idx);
	            	}
	            } else {
	            	try {
						var idx = 0; 
						console.log(marker.idx);
		            	if (marker.idx == node_select) {
		            		$scope.save_node(marker.idx);
		            		directionsDisplay.setMap(null);
		            		un_select_func($scope);
		            		return;
		            	}
		            	if ($scope.nodes[marker.idx].saved == false) {
	            			toastr.error("Its not save", "Error");
	            			return;
						}
						if (!$scope.nodes[node_select].relation)
							$scope.nodes[node_select].relation = []
		            	for (idx = 0; idx < $scope.nodes[node_select].relation.length; idx++) {
		            		if ($scope.nodes[node_select].relation[idx].idx == marker.idx) {
		            			$scope.set_relation(node_select, marker.idx, false);
		            			return;
		            		}
		            	}
	            		var from = new google.maps.LatLng($scope.nodes[node_select].position.x, $scope.nodes[node_select].position.y);
	            		var to = new google.maps.LatLng($scope.nodes[marker.idx].position.x, $scope.nodes[marker.idx].position.y);
	            		draw_direction(from, to, $scope, marker.idx);
	            	} catch (ex) {
	            		console.log(ex);
	            	}
	            }
            });
        })(marker, $scope);

        markers[i] = marker;
	}

	this.update_map = function ($scope){
		for (var i in markers) {
		    markers[i].setMap(null);
		}
		
		markers = {};

		for (var e in $scope.nodes) {
			this.create_node($scope, e);
		}
	}

	function draw_direction (from, to, $scope, i) {
		directionsDisplay.setMap(map);
        directionsService.route({
          	origin: from,
          	destination: to,
          	travelMode: 'DRIVING'
        }, function(response, status) {
          	if (status === 'OK') {
            	directionsDisplay.setDirections(response);
            	data = {
            		distance: response.routes[0].legs[0].distance.value,
            	};
        		$scope.set_relation(node_select, i, true, data, function(dt) {
        			toastr.success("Add new relation", "Successful");
        		});
          	} else {
            	window.alert('Directions request failed due to ' + status);
          	}
        });
  	}

  	this.get_distance = function(from, to) {
		var p1 = new google.maps.LatLng(from.x, from.y);
		var p2 = new google.maps.LatLng(to.x, to.y);

  		return google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
  	}

	this.__init();
};