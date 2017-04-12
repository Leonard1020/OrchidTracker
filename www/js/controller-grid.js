angular.module('starter.controllers.grid', [])

.controller('GridCtrl', function($scope, $ionicPopup, AuthService, Plots) {
	$scope.plotNumber = localStorage.getItem('selectedPlot');
	$scope.depths = ["Deep", "Shallow"];
	$scope.prep = ["Yes", "No"];
	$scope.healths = [{health: "Bad", value: 1}, {health: "Medium", value: 2}, {health: "Good", value: 3}];
	$scope.parents = ["A", "B", "C", "D", "E", "F"];
	$scope.scopes = [
		{id: 0, name: 'Whole Plot'},
		{id: 2, name: 'Quadrant A'},
		{id: 1, name: 'Quadrant B'},
		{id: 3, name: 'Quadrant C'},
		{id: 4, name: 'Quadrant D'}
	];
	$scope.selectedScope = $scope.scopes[0];

	AuthService.authRequired().then(function(response) {
		$scope.authRequired = false;
	}).catch(function(err) {
		$scope.authRequired = true;
	});

	var chart;

	$scope.addPlant = function(callback) {
		$scope.error = "";
		$ionicPopup.show({
			templateUrl: 'templates/add-plant-dialog.html',
			title: '<h3>Add a Plant</h3>',
			scope: $scope,
			buttons: [
				{text: 'Cancel'},
				{
					text:'Save',
					type: 'button-positive',
					onTap: function(e) {
						if (findPlantIndexById($scope.plants, $scope.plant.id) || findPlantIndexById($scope.plants, $scope.plant.id) == 0) {
							$scope.error = "Plant " + $scope.plant.id + " already exists";
							e.preventDefault();
						} else if ($scope.plant.id < 1) {
							$scope.error = "Invalid Plant Id";
							e.preventDefault();
						} else if ($scope.plant.x < -100 || $scope.plant.x > 100 ||
									$scope.plant.y < -100 || $scope.plant.y > 100) {
							$scope.error = "Location must be between -100 and 100";
							e.preventDefault();
						} else if ($scope.plant.shoots < 0) {
							$scope.error = "Number of shoots cannot be negative";
							e.preventDefault();
						} else if ($scope.plant.updates[0].leaves < 0) {
							$scope.error = "Number of leaves cannot be negative";
							e.preventDefault();
						} else if ($scope.plant.updates[0].lowestLeafWidth < 0 || $scope.plant.updates[0].lowestLeafLength < 0) {
							$scope.error = "Leaf dimensions cannot be negative";
							e.preventDefault();
						} else if ($scope.plant.updates[0].leaves < 1 && ($scope.plant.updates[0].lowestLeafWidth || $scope.plant.updates[0].lowestLeafLength)) {
							$scope.error = "Leaf dimensions cannot exist if there are no leaves";
							e.preventDefault();
						} else {
							$scope.error = "";
							var startingDate = new Date().toISOString();
							$scope.plant.updates[0].updated = startingDate;
							$scope.plants.push($scope.plant);
							var total = $scope.plants.filter(getPresentPlants).length;
							chart.setTitle(null, {text: 'Plant count: ' + total + "/" + $scope.plants.length});

							Plots.putPlants($scope.plants, $scope.plotNumber, function(response) {
								callback();
							}, function(error) {
								console.log('Error: ' + error);
							});
						}
					}
				}
			]
		});
	};
	Plots.getPlants($scope.plotNumber).then(function(plants) {
		$scope.plants = plants ? plants : [];
		$scope.startYears = ['Beginning of Time'];
		$scope.endYears = ['Today'];
		$scope.startYear = $scope.startYears[$scope.startYears.length - 1];
		$scope.endYear = $scope.endYears[$scope.endYears.length - 1];

		var axis = {
			title: {
				text: ''
			},
			labels: {
				enabled: false
			},
			min: -100,
			max: 100,
			gridLineWidth: 0,
			minorTickInterval: 25,
			startOnTick: true,
			endOnTick: true,
			showLastLabel: true,
			plotLines: [{
				color: '#C0C0C0',
				dashStyle: 'solid',
				width: 2,
				value: 0,
				zIndex: 3
			}]
		}

		var grid = $('#grid');
		grid.highcharts({
			chart: {
				type: 'scatter',
				zoomType: 'xy',
				plotBorderWidth: 2,
				events: {
					click: function (e) {
						if ($scope.authRequired) {
							return;
						}
						// find the clicked values and the series
						$scope.plant = {
							x: e.xAxis[0].value,
							y: e.yAxis[0].value,
							depth: "",
							parent: "",
							surfacePrep: "",
							health: 1,
							shoots: 0,
							updates: [
								{
									height: 0,
									leaves: 0,
									lowestLeafWidth: 0,
									lowestLeafLength: 0,
									present: "Yes",
									comment: "",
									observer: AuthService.getUser()
								}
							]
						};
						$scope.plants.sort(function(a,b){return a.id-b.id});

						var largestID = 0;
						if ($scope.plants.length > 0) {
							largestID = $scope.plants[$scope.plants.length - 1].id;
						}
						$scope.plant.id = largestID + 1;

						$scope.error = "";
						$scope.addPlant(function() {
							var series = categorizePoints($scope.plants);
							for (var i in chart.series) {
								chart.series[i].setData(series[i].data, true);
							}
						});
					}
				}
			},
			title: {
				text: null
			},
			subtitle: {
				text: 'Plant count: ' + $scope.plants.filter(getPresentPlants).length + "/" + $scope.plants.length
			},
			xAxis: axis,
			yAxis: axis,
			legend: {
				enabled: true,
				align: 'left',
				maxHeight: 100
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
									health: this.health,
									shoots: this.shoots,
									depth: this.depth,
									surfacePrep: this.surfacePrep,
									parentage: this.parent,
									updates: this.updates
								}

								var updateButton = {
									text:'Update',
									type:'button-positive',
									onTap: function(e) {
										if ($scope.authRequired) {
											var alertPopup = $ionicPopup.alert({
												title: 'Not Signed In'
											});
											return;
										}

										var binding = $scope.info.updates[$scope.info.updates.length - 1];
										var update = {
											present: binding.present,
											comment: binding.comment,
											updated: new Date().toISOString(),
											observer: AuthService.getUser()
										};
										if (update.present === "Yes") {
											update.height = binding.height != null ? binding.height : "";
											update.leaves = binding.leaves != null ? binding.leaves : "";
											update.lowestLeafWidth = binding.lowestLeafWidth != null ? binding.lowestLeafWidth : "";
											update.lowestLeafLength = binding.lowestLeafLength != null ? binding.lowestLeafLength : "";
										}

										var index = findPlantIndexById($scope.plants, $scope.info.id);
										$scope.plants[index].updates.push(update);
										var total = $scope.plants.filter(getPresentPlants).length;
										chart.setTitle(null, {text: 'Plant count: ' + total + "/" + $scope.plants.length});

										Plots.putPlants($scope.plants, $scope.plotNumber, function(response) {
											var series = categorizePoints($scope.plants);
											for (var i in chart.series) {
												chart.series[i].setData(series[i].data, true);
											}
										}, function(response) {
											console.log('Error: ' + response);
										});
									}
								}

								var buttons = [ {text: 'Cancel'} ];
								if (!$scope.authRequired) {
									buttons.push(updateButton);
								}

								$ionicPopup.show({
									templateUrl: 'templates/plant-info-dialog.html',
									title: '<h3>Plant ' + this.id + '</h3>',
									scope: $scope,
									buttons: buttons
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
			series: categorizePoints($scope.plants)
		});

		chart = grid.highcharts();
		chart.setSize(chart.chartWidth, chart.chartWidth + 150);
	});

	function categorizePoints(plants) {
		var series = [];
		var years = [];
		for (var p in plants) {
			var plant = plants[p];
			var date = new Date(plant.updates[0].updated).getFullYear();
			if (years.indexOf(date) < 0) {
				years.push(date);
			}
		}
		for (var y in years) {
			var year = years[y];
			var yearFilter = plants.filter(function(plant) {
				return plant.updates[0].updated.startsWith(year);
			}).filter(getPresentPlants);

			var color = 'rgba(255, 0, 0, .5)'; //red
			if (year == 2016) {
				color = 'rgba(255, 150, 0, .5)'; //orange
			} else if (year == 2017) {
				color = 'rgba(229, 217, 0, .8)'; //yellow
			} else if (year == 2018) {
				color = 'rgba(34, 139, 34, .5)'; //green
			} else if (year == 2019) {
				color = 'rgba(0, 0, 255, .5)'; //blue
			} else if (year == 2020) {
				color = 'rgba(128, 0, 128, .5)'; //violet
			}

			var categories = [{
				name: 'Healthy Plant (' + year + ')',
				color: color,
				data: yearFilter.filter(getGoodPlants),
				marker: {
					"symbol": "triangle"
				}
			}, {
				name: 'Medium Plant (' + year + ')',
				color: color,
				data: yearFilter.filter(getMediumPlants),
				marker: {
					"symbol": "circle"
				}
			}, {
				name: 'Poor Plant (' + year + ')',
				color: color,
				data: yearFilter.filter(getPoorPlants),
				marker: {
					"symbol": "triangle-down"
				}
			}];
			series = series.concat(categories);
		}
		series.push({
			name: 'Not Present',
			color: 'rgba(100,100,100, .5)',
			data: $scope.plants.filter(getNonPresentPlants),
			marker: {
				"symbol": "diamond"
			}
		});

		return series;
	}

	$scope.updatePlotScope = function(item) {
		if (item.id == 0) {
			chart.xAxis[0].setExtremes(-100,100);
			chart.yAxis[0].setExtremes(-100,100);
		} else if (item.id == 1) {
			chart.xAxis[0].setExtremes(0,100);
			chart.yAxis[0].setExtremes(0,100);
		} else if (item.id == 2) {
			chart.xAxis[0].setExtremes(-100,0);
			chart.yAxis[0].setExtremes(0,100);
		} else if (item.id == 3) {
			chart.xAxis[0].setExtremes(-100,0);
			chart.yAxis[0].setExtremes(-100,0);
		} else if (item.id == 4) {
			chart.xAxis[0].setExtremes(0,100);
			chart.yAxis[0].setExtremes(-100,0);
		}
	}
});

function getGoodPlants(plant) {
	return plant.health == 3;
};

function getMediumPlants(plant) {
	return plant.health == 2;
};

function getPoorPlants(plant) {
	return plant.health == 1;
};

function getNonPresentPlants(plant) {
	return plant.updates[plant.updates.length - 1].present === "No";
};

function getPresentPlants(plant) {
	return plant.updates[plant.updates.length - 1].present === "Yes";
};

function getYears(plants) {
	var years = [];
	for (plant in plants){
		for (update in plants[plant].updates) {
			var year = parseInt(plants[plant].updates[update].updated);
			if (years.indexOf(year) == -1) {
				years.push(year);
			}
		}
	}
	return years.sort(function(a,b){return a-b});
}

function findPlantIndexById(array, id) {
	for (var i = 0; i < array.length; i++) {
		if (array[i].id == id){
			return i;
		}
	}
};

function getPlotNumbers(getAll, callback) {
	var plotNumbers = [];
	getAll.$loaded().then(function(plots) {
		for (p in plots)
			if (plots[p].number)
				plotNumbers.push({id: plots[p].$id, number: plots[p].number});
		callback(plotNumbers.sort(function(a,b){return a.number-b.number}))
	});
}
