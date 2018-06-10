function Cy() {
  	var cy = cytoscape({
	    container: document.getElementById('cy'),
	    layout: {
	      	name: 'cose',
	      	padding: 10,
	      	randomize: true
	    },
  		maxZoom: 3,
	    autoungrabify: true,
	    style: cytoscape.stylesheet()
	      .selector('node')
	        .css({
	          'shape': 'ellipse',
	          'content': 'data(name)',
	          'text-valign': 'center',
	          'text-outline-width': 2,
	          'text-outline-color': 'data(fave_color)',
	          'background-color': 'data(fave_color)',
	          'color': '#fff'
	        })
	      .selector(':selected')
	        .css({
	          'border-width': 3,
	          'border-color': '#333'
	        })
	      .selector('edge')
	        .css({
	          'curve-style': 'bezier',
	          'opacity': 0.666,
	          'target-arrow-shape': 'triangle',
	          'source-arrow-shape': 'circle',
	          'line-color': 'data(fave_color)',
	          'source-arrow-color': 'data(fave_color)',
	          'target-arrow-color': 'data(fave_color)',
	          'content': 'data(label)',
	          'edge-text-rotation': 'autorotate',
	          "font-size": 10,
	          'text-background-opacity': 1,
	          'text-background-color': '#ccc',
	          'text-background-shape': 'roundrectangle',
	          'text-border-color': '#000',
	          'text-border-width': 1,
	        }),
	    
    	elements: { nodes: [], edges: [] },
	});

	var color = {connect: "#F5A45D", disconnect: "#8e8655"};


  	var edge_fave_color_sources = ["#FFFFFF", "#FFFFCC", "#FFFF99", "#FFFF66", "#FFFF33", "#FFFF00"];
  	var edge_fave_color_targets = ["#00FFFF", "#00FFCC", "#00FF99", "#00FF66", "#00FF33", "#00FF00"];
  	var scale = 300000;
  	var o00 = {x: 102, y: 8}

  	this.__get_vis_position = function (position){
  		return { x: (position.y - o00.y) * scale, y: (- (position.x - o00.x) * scale) }
  	}
	this.create_node = function($scope, idx) {
		try {
			if (cy !== null) {
				cy.add({
					group: "nodes",
				    data: { id: 'n' + idx, name: $scope.nodes[idx].code,  fave_color: color.disconnect, idx: idx },
				    position: this.__get_vis_position($scope.nodes[idx].position)
				}).on("click", function() {
					$scope.node_option(idx);
				});
			}
		} catch(ex) {
			console.log("Error: cy.js add_node function, Error: " + ex);
		}
	}
	this.fit = function () {
		cy.fit(cy.$("*"));
	}

	this.update_node = function($scope, idx) {
		var obj = cy.$("#n" + idx);

		obj.position(this.__get_vis_position($scope.nodes[idx].position));
		obj.data({name: $scope.nodes[idx].code});
		this.update_edge($scope, idx);
	}

	this.node_connect = function (_id, b) {
		var obj = cy.$("#n" + _id);
		if (b) {
			obj.css({'background-color': color.connect, 'text-outline-color': color.connect});
		} else {
			obj.css({'background-color': color.disconnect, 'text-outline-color': color.disconnect});
		}
	}

	this.add_edge = function($scope, from, to, edge_data) {
		cy.startBatch();
		var data = {
			id: "e" + from + "_" + to,
			source: "n" + from,
			target: "n" + to,
			fave_color: edge_fave_color_sources[0],
			label: "",
		};

		var edge = cy.$("#e" + to + "_" + from);
		if (edge.length > 0) {
			if(edge[0].data().fave_color === edge_fave_color_sources[0])
				data.fave_color = edge_fave_color_targets[0];
		}

		var e = cy.add({
			group: "edges",
			data: data,
		});
		e.on("click", function() {
			$scope.save_edge(from, to);
			console.log(this);
		});

		cy.endBatch();
	}
	this.update_edge = function ($scope, idx) {
		cy.startBatch();

		cy.remove(cy.$("[id^='e" + idx + "']"));
		if (Object.keys($scope.nodes[idx].relation)) {
			for (var i = 0; i < $scope.nodes[idx].relation.length; i++) {
				console.log($scope.nodes[idx].relation[i]);
				this.add_edge($scope, idx, $scope.nodes[idx].relation[i].idx, $scope.nodes[idx].relation[i]);
			}
		}
		cy.endBatch();
	}
	this.update_vehicle = function (from, to, data) {
		cy.$("#e" + from + "_" + to).data({label: data});
	}

	this.initialize = function($scope, toastr) {
		if ($scope.nodes === null || Object.keys($scope.nodes).length == 0)
			return;

		cy.startBatch();
		cy.remove('*');
		for (var i in $scope.nodes){
			this.create_node($scope, i);
		}
		for (var i in $scope.nodes){
			if (Array.isArray($scope.nodes[i].relation)) {
				for (var j = 0; j < $scope.nodes[i].relation.length; j++){
					this.add_edge($scope, i, $scope.nodes[i].relation[j].idx, $scope.nodes[i].relation[j]);
				}
			}
		}
		for (var i in $scope.devices){
			if ($scope.devices[i] == true) {
				this.node_connect(i, true);
				toastr.info("Node " + $scope.nodes[i].name + " is connected", "Info");
			}
		}
		cy.endBatch();
	}
}