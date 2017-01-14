angular.module('starter.controllers.graph', [])

.controller('GraphCtrl', function($scope, Plots) {
	$scope.graphs = ['Number of Plants'];
	if ($scope.graphs.indexOf(localStorage.getItem('selectedGraph')) < 0) {
		localStorage.setItem('selectedGraph', $scope.graphs[0]);
	}
	$scope.selectedGraph = localStorage.getItem('selectedGraph');

	Plots.getPlants(localStorage.getItem('selectedPlot'))
		.then(function(response) {
			$scope.plants = response;
			createGraph();
		});

	$scope.loadGraph = function(selectedGraph) {
		localStorage.setItem('selectedGraph', selectedGraph);
		//TODO load new graph
	}

	function createGraph() {
		if ($scope.selectedGraph == $scope.graphs[0]) {
			$scope.series = ['Plant Count']

			$scope.data = [];
			for (p in $scope.plants) {
				var plant = $scope.plants[p];
				for (u in plant.updates) {
					var update = plant.updates[u];

					if (update.present == 'No')
						continue;

					var time = update.updated.split('T')[0];
					var date = $scope.data.find(point => point.time == time);

					if (date) {
						date.count++;
					} else {
						$scope.data.push({time: time, count: 1});
					}
				}
			}
			$scope.data.sort(function(a,b){
			  return new Date(b.time) - new Date(a.time);
			});
			$scope.labels = $scope.data.map(set => set.time);
			$scope.data = [$scope.data.map(set => set.count)];

		  $scope.options = {
				layout: {
			    padding: 20
			  },
		    scales: {
					xAxes: [
						{
							type: 'time',
							barPercentage: 0.2,
							position: 'bottom'
						}
					],
		      yAxes: [
		        {
		          type: 'linear',
		          position: 'left'
		        }
		      ]
		    }
		  };
		}
	}
})
