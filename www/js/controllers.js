angular.module('starter.controllers', [])

.controller('NavCtrl', function($scope, $ionicPopup, $ionicHistory, $state, Plots) {
	Plots.getNumbers()
		.success(function(response) {
			$scope.plotNumbers = response.sort(function(a,b){return a-b});
		});
		
	$scope.selectPlot = function(number) {
		if (localStorage.getItem('selectedPlot') != number) {
			localStorage.setItem('selectedPlot', number)
			$state.go('tab.status', null, {reload: true});
		};
	};
	
	$scope.addPlot = function() {
		var largestID = $scope.plotNumbers[$scope.plotNumbers.length - 1];
		
		$scope.plot = {
			number: largestID + 1,
			location: {
				latitude: "",
				longitude: ""
			},
			ph: 7,
			moisture: 50,
			light: 50,
			description: "",
			comment: "",
			entries: []
		};
		
		var posOptions = {timeout: 10000, enableHighAccuracy: false};
		navigator.geolocation.getCurrentPosition(function (position) {
				$scope.plot.location.latitude = position.coords.latitude;
				$scope.plot.location.longitude = position.coords.longitude;
				$state.go($state.current, {}, {reload: true});
			}, function(err) {
				console.log(err)
			}, posOptions);
		
		var addPlotDialog = $ionicPopup.show({
			templateUrl: '../templates/add-plot-dialog.html',
			title: '<h3>Add a Plot</h3>',
			scope: $scope,
			buttons: [
				{text: 'Cancel'},
				{
					text:'Save',
					type: 'button-positive',
					onTap: function(e) {
						if ($scope.plotNumbers.includes($scope.plot.number)) {
							//Plot number already exists
							e.preventDefault();
						} else {
							var date = new Date();
							$scope.plot.started = date;
							$scope.plot.updated = date;
							
							Plots.post($scope.plot, function(response) {
									localStorage.setItem('selectedPlot', $scope.plot.number)
									Plots.getNumbers()
										.success(function(response) {
											$scope.plotNumbers = response.sort(function(a,b){return a-b});
										});
									$state.go('tab.status', null, {reload: true});
								}, function(response) {
									console.log('Error: ' + response);
								});
						}
					}
				}
			]
		});
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

.controller('GridCtrl', function($scope, $ionicPopup, Plots) {
	$scope.plotNumber = localStorage.getItem('selectedPlot');
	$scope.depths = ["Deep", "Shallow"];
	$scope.healths = [{health: "Bad", value: 1}, {health: "Medium", value: 2}, {health: "Good", value: 3}];
	$scope.parents = ["A", "B", "C", "D", "E", "F"];
	$scope.scopes = [
		{id: 0, name: 'Whole Plot'},
		{id: 1, name: 'Quadrant 1'},
		{id: 2, name: 'Quadrant 2'},
		{id: 3, name: 'Quadrant 3'},
		{id: 4, name: 'Quadrant 4'}
	];
	$scope.selectedScope = $scope.scopes[0];
	
	var chart;
	
	$scope.addPlant = function(callback) {
		$ionicPopup.show({
			templateUrl: '../templates/add-plant-dialog.html',
			title: '<h3>Add a Plant</h3>',
			scope: $scope,
			buttons: [
				{text: 'Cancel'},
				{
					text:'Save',
					type: 'button-positive',
					onTap: function(e) {
						if (false /*!$scope.data.wifi*/) {
							//don't allow the user to close unless he enters wifi password
							e.preventDefault();
						} else {
							$scope.plant.created = new Date();
							$scope.entries[0].flowers.push($scope.plant);
							var total = $scope.entries[0].flowers.length
							chart.setTitle(null, {text: 'Orchid count: ' + total});
							
							Plots.putPlants($scope.entries, $scope.plotNumber, function(response) {
								callback();
							}, function(response) {
								console.log('Error: ' + response);
							});
						}
					}
				}
			]
		});
	};
	
	$scope.plantInfo = function(callback) {
		$ionicPopup.show({
			templateUrl: '../templates/plant-info-dialog.html',
			title: '<h3>Add a Plant</h3>',
			scope: $scope,
			buttons: [
				{text: 'Cancel'},
				{
					text:'Save',
					type: 'button-positive',
					onTap: function(e) {
						if (false /*!$scope.data.wifi*/) {
							//don't allow the user to close unless he enters wifi password
							e.preventDefault();
						} else {
							$scope.plant.created = new Date();
							$scope.entries[0].flowers.push($scope.plant);
							var total = $scope.entries[0].flowers.length
							chart.setTitle(null, {text: 'Orchid count: ' + total});
							
							Plots.putPlants($scope.entries, $scope.plotNumber, function(response) {
								callback();
							}, function(response) {
								console.log('Error: ' + response);
							});
						}
					}
				}
			]
		});
	};
	
	Plots.getPlants($scope.plotNumber)
		.success(function(response) {
			$scope.entries = response;
			if ($scope.entries.length == 0) {
				$scope.entries.push({updated: new Date(), flowers: []})
			}
			
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
							$scope.plant = {
								x: e.xAxis[0].value,
								y: e.yAxis[0].value,
								depth: "Deep",
								health: 1,
								parent: "A",
								shoots: 0,
								comment: ""
							};
							
							$scope.entries[0].flowers.sort(function(a,b){return a.id-b.id});
							var largestID = $scope.entries[0].flowers[$scope.entries[0].flowers.length - 1].id;
							$scope.plant.id = largestID + 1;
							
							$scope.addPlant(function() {
								var goodPlants = $scope.entries[0].flowers.filter(goodOrchids);
								var mediumPlants = $scope.entries[0].flowers.filter(mediumOrchids);
								var badPlants = $scope.entries[0].flowers.filter(poorOrchids);
								chart.series[0].setData(goodPlants, true);
								chart.series[1].setData(mediumPlants, true);
								chart.series[2].setData(badPlants, true);
							});
						}
					}
				},
				title: {
					text: null
				},
				subtitle: {
					text: 'Orchid count: ' + $scope.entries[0].flowers.length
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
							radius: 6,
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
									$scope.info = {
										id: this.id,
										x: this.x,
										y: this.y,
										depth: this.depth,
										parentage: this.parent,
										health: this.health,
										created: this.created,
										shoots: this.shoots,
										comment: this.comment
									}
									
									$ionicPopup.show({
										templateUrl: '../templates/plant-info-dialog.html',
										title: '<h3>Plant ' + this.id + '</h3>',
										scope: $scope,
										buttons: [
											{text: 'Cancel'},
											{
												text:'Remove',
												type: 'button-assertive',
												onTap: function(e) {
													var confirmPopup = $ionicPopup.confirm({
														title: 'Remove Plant ' + this.id,
														template: 'Are you sure you want to remove this plant?'
													});

													confirmPopup.then(function(res) {
														if(res) {
															console.log($scope.info.id);
															var index = findPlantIndexById($scope.entries[0].flowers, $scope.info.id);
															$scope.entries[0].flowers.splice(index, 1);
															var total = $scope.entries[0].flowers.length
															chart.setTitle(null, {text: 'Orchid count: ' + total});
															
															Plots.putPlants($scope.entries, $scope.plotNumber, function(response) {
																var goodPlants = $scope.entries[0].flowers.filter(goodOrchids);
																var mediumPlants = $scope.entries[0].flowers.filter(mediumOrchids);
																var badPlants = $scope.entries[0].flowers.filter(poorOrchids);
																chart.series[0].setData(goodPlants, true);
																chart.series[1].setData(mediumPlants, true);
																chart.series[2].setData(badPlants, true);
															}, function(response) {
																console.log('Error: ' + response);
															});
														}
													});
												}
											}
										]
									});
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
					data: $scope.entries[0].flowers.filter(goodOrchids),
					marker: {
						"symbol": "circle"
					}
				}, {
					name: 'Medium Plants',
					color: 'rgba(229,217,0, .8)',
					data: $scope.entries[0].flowers.filter(mediumOrchids),
					marker: {
						"symbol": "circle"
					}
				}, {
					name: 'Poor Plants',
					color: 'rgba(255,0,0, .5)',
					data: $scope.entries[0].flowers.filter(poorOrchids),
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

function findPlantIndexById(array, id) {
	for (var i = 0; i < array.length; i++) {
		if (array[i].id == id){
			return i;
		}
	}
};
