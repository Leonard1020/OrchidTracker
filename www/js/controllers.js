angular.module('starter.controllers', [])

.controller('NavCtrl', function($scope, $ionicHistory, $state, Plots) {
	Plots.getNumbers()
		.success(function(response) {
			$scope.plotNumbers = response;
		});
		
	$scope.selectPlot = function(number) {
		if (localStorage.getItem('selectedPlot') != number) {
			localStorage.setItem('selectedPlot', number)
			$state.go('tab.status', null, {reload: true});
		};
	};
})

.controller('StatusCtrl', function($scope, Plots) {
	Plots.get(localStorage.getItem('selectedPlot'))
		.success(function(response) {
			$scope.plot = response;
		});
})

.controller('UpdateCtrl', function($scope, $state, Plots) {
	Plots.get(localStorage.getItem('selectedPlot'))
		.success(function(response) {
			$scope.plot = response;
		});
		
	$scope.updatePlot = function(plot) {
		Plots.put(plot, function(response) {
				$state.go('tab.status', null, {reload: true});
			}, function(response) {
				console.log('Error: ' + response);
			});
	};
})

.controller('GraphCtrl', function($scope) {})

.controller('GridCtrl', function($scope, Plots) {
	$scope.scopes = [
		{id: 0, name: 'Whole Plot'},
		{id: 1, name: 'Quadrant 1'},
		{id: 2, name: 'Quadrant 2'},
		{id: 3, name: 'Quadrant 3'},
		{id: 4, name: 'Quadrant 4'}
	];
	$scope.selectedScope = $scope.scopes[0];
	
	var chart;
	
	Plots.get(localStorage.getItem('selectedPlot'))
		.success(function(response) {
			$scope.plot = response;
			
			var grid = $('#grid');
			grid.highcharts({
				chart: {
					type: 'scatter',
					zoomType: 'xy',
					plotBorderWidth: 2,
					height: grid.width() + 60,
					events: {
						click: function (e) {
							// find the clicked values and the series
							var x = e.xAxis[0].value;
							var y = e.yAxis[0].value;
							var series = this.series[0];
							
							// Add it
							series.addPoint([x, y]);
							
							var total = 0;
							for (var set in this.series){
								total += this.series[set].data.length;
							}
							
							chart.setTitle(null, {text: 'Orchid count: ' + total});
						}
					}
				},
				title: {
					text: null
				},
				subtitle: {
					text: 'Orchid count: ' + $scope.plot.entries[0].flowers.length
				},
				xAxis: {
					title: {
						enabled: true,
						text: ''
					},
					labels: {
						enabled: true
					},
					min: 0,
					max: 200,
					gridLineWidth: 0,
					minorTickInterval: 25,
					startOnTick: true,
					endOnTick: true,
					showLastLabel: true,
					plotLines: [{
						color: '#C0C0C0',
						dashStyle: 'solid',
						width: 2,
						value: 100,
						zIndex: 3
					}]
				},
				yAxis: {
					title: {
						text: ''
					},
					labels: {
						enabled: false
					},
					min: 0,
					max: 200,
					gridLineWidth: 0,
					minorTickInterval: 25,
					startOnTick: true,
					endOnTick: true,
					showLastLabel: true,
					plotLines: [{
						color: '#C0C0C0',
						dashStyle: 'solid',
						width: 2,
						value: 100,
						zIndex: 3
					}]
				},
				legend: {
					enabled: false
				},
				plotOptions: {
					scatter: {
						marker: {
							radius: 5,
							states: {
								hover: {
									enabled: true,
									lineColor: 'rgb(100,100,100)'
								}
							},
						},
						states: {
							hover: {
								marker: {
									enabled: false
								}
							}
						},
						point: {
							events: {
								'click': function () {
									alert("ID: " + this.id +
										"\nX: " + this.x + "cm" +
										"\nY: " + this.y + "cm" +
										"\ndepth: " + this.depth +
										"\nparentage: " + this.parentage +
										"\nhealth: " + this.health);
									//var count = this.series.data.length - 1;
									//if (count > 0) {
									//	this.remove();
									//	chart.setTitle(null, {text: 'Orchid count: ' + count});
									//}
								}
							}
						},
						tooltip: {
							headerFormat: '<b>{series.name}</b><br>',
							pointFormat: '{point.x} cm, {point.y} cm'
						}
					}
				},
				series: [{
					name: 'Healthy Plants',
					color: 'rgba(34,139,34, .5)',
					data: $scope.plot.entries[0].flowers.filter(goodOrchids),
					marker: {
						"symbol": "circle"
					}
				}, {
					name: 'Medium Plants',
					color: 'rgba(229,217,0, .8)',
					data: $scope.plot.entries[0].flowers.filter(mediumOrchids),
					marker: {
						"symbol": "circle"
					}
				}, {
					name: 'Poor Plants',
					color: 'rgba(255,0,0, .5)',
					data: $scope.plot.entries[0].flowers.filter(poorOrchids),
					marker: {
						"symbol": "circle"
					}
				}]
			});
			
			chart = grid.highcharts();
		});
		
	$scope.updatePlotScope = function(item) {
		if (item.id == 0) {
			chart.xAxis[0].setExtremes(0,200);
			chart.yAxis[0].setExtremes(0,200);
			//chart.yAxis[0].update({
			//	labels: { enabled: false }
			//});
		} else if (item.id == 1) {
			chart.xAxis[0].setExtremes(100,200);
			chart.yAxis[0].setExtremes(100,200);
		} else if (item.id == 2) {
			chart.xAxis[0].setExtremes(0,100);
			chart.yAxis[0].setExtremes(100,200);
		} else if (item.id == 3) {
			chart.xAxis[0].setExtremes(0,100);
			chart.yAxis[0].setExtremes(0,100);
		} else if (item.id == 4) {
			chart.xAxis[0].setExtremes(100,200);
			chart.yAxis[0].setExtremes(0,100);
		}
	}
});

function goodOrchids(orchid) {
	return orchid.health == 3;
};

function mediumOrchids(orchid) {
	return orchid.health == 2;
};

function poorOrchids(orchid) {
	return orchid.health == 1;
};
