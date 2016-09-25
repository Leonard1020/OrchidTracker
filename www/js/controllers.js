angular.module('starter.controllers', [])

.controller('NavCtrl', function($scope, $rootScope, $ionicPopup, $location, $mdDialog, $ionicHistory, $window, $state, AuthService, Plots) {
	$scope.plotNumbers = [];
	getPlotNumbers(Plots.all(), function(array) {
		$scope.plotNumbers = array;
	});

  $rootScope.$on('plotAdded', function(event, args) {
    console.log('here');
    getPlotNumbers(Plots.all(), function(array) {
  		$scope.plotNumbers = array;
  	});
  });

	$scope.selectPlot = function(number) {
		if (localStorage.getItem('selectedPlot') != number) {
			localStorage.setItem('selectedPlot', number);
			$state.go('tab.status', null, {reload: true});
		};
	};

	AuthService.authRequired().then(function(response) {
		$scope.authRequired = false;
	}).catch(function(err) {
		$scope.authRequired = true;
	});

	$scope.logout = function() {
    var confirm = $mdDialog.confirm()
          .title('Logout')
          .textContent('Are you sure you want to log out?')
          //.ariaLabel('Lucky day')
          .ok('Logout')
          .cancel('Cancel');

    $mdDialog.show(confirm).then(function() {
      AuthService.logout();
      $scope.authRequired = true;
      $window.location.reload(true);
    }, function() {
      //Do nothing;
    });
	};

  $scope.login = function() {
    $state.go('tab.login', null, {reload: true});
	};

	$scope.addPlot = function() {
		var largestID = $scope.plotNumbers[$scope.plotNumbers.length - 1].number;

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
			plants: []
		};

		var posOptions = {timeout: 10000, enableHighAccuracy: false};
		navigator.geolocation.getCurrentPosition(function (position) {
				$scope.plot.location.latitude = position.coords.latitude;
				$scope.plot.location.longitude = position.coords.longitude;
				$state.go($state.current, {}, {reload: true});
			}, function(err) {
				console.log(err)
			}, posOptions);

    $mdDialog.show({
      templateUrl: 'templates/add-plot-dialog.html',
      controller: AddPlotController,
      clickOutsideToClose:true,
      locals: {
        plotNumbers: $scope.plotNumbers,
        plot: $scope.plot
      }
    });
    function AddPlotController($scope, $mdDialog, plotNumbers, plot) {
      $scope.plotNumbers = plotNumbers;
      $scope.plot = plot;
      $scope.cancel = function() {
        $mdDialog.cancel();
      }
      $scope.createPlot = function() {
        if ($scope.plotNumbers.find(function(index) { return index.number == $scope.plot.number; })) {
          $scope.error = "Plot " + $scope.plot.number + " already exists";
        } else if ($scope.plot.number < 1) {
          $scope.error = "Invalid Plot Number";
        } else if ($scope.plot.location.latitude < -90 || $scope.plot.location.latitude > 90) {
          $scope.error = "Latitude must be between -90 and 90";
        } else if ($scope.plot.location.longitude < -180 || $scope.plot.location.longitude > 180) {
          $scope.error = "Longitude must be between -180 and 180";
        } else {
          var date = new Date().toISOString();
          $scope.plot.started = date;
          $scope.plot.updated = date;

          $rootScope.$emit('plotAdded', {});

          try {
            Plots.add($scope.plot, function(response) {
              localStorage.setItem('selectedPlot', $scope.plot.number)
              $state.go('tab.status', null, {reload: true});
              $mdDialog.cancel();
            }).error(function(err) {
              $scope.error = err.message;
            });
          } catch (err) {
            if (err.code == 'PERMISSION_DENIED') {
              $scope.error = "Permission Denied";
            } else if (err.message.indexOf("'key'") > -1) {
              localStorage.setItem('selectedPlot', $scope.plot.number)
              getPlotNumbers(Plots.all(), function(array) {
                  $scope.plotNumbers = array;
              });
              $state.go('tab.status', null, {reload: true});
              $mdDialog.cancel();
            }
          }
        }
      }
    }
	};
})

.controller('LoginCtrl', function($scope, $mdDialog, $window, $state, AuthService) {
  $scope.error = '';
  $scope.loginEmail = function(email, password) {
  	if (!email || !password) {
  			$scope.error = "Enter username and password";
  			return;
  	}
  	$('#circle').show();
  	try {
  		AuthService.loginUser(email, password, function(authData) {
        $state.go('tab.status', null, {reload: true});
        $window.location.reload(true);
  		}, function(err) {
  			$scope.error = 'Username and password are incorrect';
  			$('#circle').hide();
  		});
  	} catch (err) {
  		$scope.error = 'Login failed';
  		$('#circle').hide();
  	}
  };

  $scope.signInWithGoogle = function() {
  	try {
  		AuthService.signInWithGoogle(function(response) {
        $state.go('tab.status', null, {reload: true});
        $window.location.reload(true);
  		}, function(err) {
  			$scope.error = 'Error signing in with Google';
  		});
  	} catch (err) {
  		$scope.error = 'Sign in failed';
  	}
  };

  $scope.openPassResetDialog = function() {
    $scope.error = '';
    $mdDialog.show({
      controller: resetPasswordController,
      templateUrl: 'templates/resetPassword.html',
      clickOutsideToClose:true
    });
    function resetPasswordController($scope, $mdDialog) {
      $scope.cancel = function() {
        $scope.error = "";
        $mdDialog.cancel();
      };
      $scope.resetPassword = function(email) {
        if (!email) {
          $scope.error = "Enter a valid email";
        }
        AuthService.resetPassword(email, function(user) {
          $scope.error = "";
          $mdDialog.cancel();
        }, function(error) {
          $scope.error = error.message;
        });
      };
    }
  };

  $scope.openCreateUserDialog = function() {
    $scope.error = '';
    $mdDialog.show({
      controller: createUserController,
      templateUrl: 'templates/createUser.html',
      clickOutsideToClose:true
    });
    function createUserController($scope, $mdDialog) {
      $scope.cancel = function() {
        $scope.error = "";
        $mdDialog.cancel();
      };
      $scope.createUser = function(email, password, secondPassword) {
        if (!email) {
          $scope.error = "Enter a valid email";
        }
        if (!password) {
          $scope.error = "Enter a password";
          return;
        }
        if (password != secondPassword) {
          $scope.error = "Passwords do not match";
          return;
        }
        $('#createUserCircle').show();
        AuthService.createUser(email, password, function(user) {
          $('#createUserCircle').hide();
          $scope.error = "";
          $mdDialog.cancel();
          $state.go('tab.status', null, {reload: true});
          $window.location.reload(true);
        }, function(error) {
          $scope.error = error.message;
          $('#createUserCircle').hide();
        });
      };
    }
  };
})

.controller('StatusCtrl', function($scope, Plots) {
	Plots.get(localStorage.getItem('selectedPlot')).$loaded().then(function(plot) {
		$scope.plot = plot;
		if (!plot.plants) {
			$scope.plot.plants = [];
		}
		$scope.plantCount = plot.plants.filter(getLivingPlants).length;
	});
})

.controller('UpdateCtrl', function($scope, $state, Plots, AuthService) {
	$scope.plot = Plots.get(localStorage.getItem('selectedPlot'));

	AuthService.authRequired().then(function(response) {
		$scope.authRequired = false;
	}).catch(function(err) {
		$scope.authRequired = true;
	});

	$scope.updatePlot = function(plot) {
		Plots.update(plot, function(response) {
				$state.go('tab.status', null, {reload: true});
			}, function(response) {
				console.log('Error: ' + response);
			});
	};
})

.controller('GraphCtrl', function($scope, $state, $window, $ionicHistory, Plots) {
	$scope.graphs = ['Number of Plants', 'Current Plot Health', 'Yearly Plot Health'];

	if ($scope.graphs.indexOf(localStorage.getItem('selectedGraph')) < 0) {
		localStorage.setItem('selectedGraph', $scope.graphs[0]);
	};

	$scope.selectedGraph = localStorage.getItem('selectedGraph');

	Plots.getPlants(localStorage.getItem('selectedPlot')).then(function(plants) {
		$scope.plants = plants ? plants : [];
		$scope.years = getYears($scope.plants);
		createGraph();
	});

	$scope.loadGraph = function(selectedGraph) {
		localStorage.setItem('selectedGraph', selectedGraph);
		$state.go($state.current, {}, {reload: true});
		//$state.reload();
	}

	function createGraph() {
		if ($scope.selectedGraph == 'Number of Plants') {
			$('#graph').highcharts({
				chart: {
					type: 'column'
				},
				title: {
					text: 'Number of Plants'
				},
				xAxis: {
					categories: $scope.years,
					crosshair: true
				},
				yAxis: {
					title: {
						text: 'Number of Plants'
					},
					min: 0
				},
				legend: {
					enabled: false
				},
				plotOptions: {
					column: {
						pointPadding: 0.2,
						borderWidth: 0
					}
				},
				series: [{
					name: 'Count',
					data: getPlantCountPerYear($scope.plants)
				}]
			});
		} else if ($scope.selectedGraph == 'Current Plot Health') {
			$('#graph').highcharts({
				chart: {
					plotBackgroundColor: null,
					plotBorderWidth: null,
					plotShadow: false,
					type: 'pie'
				},
				title: {
					text: 'Current Plot Health'
				},
				series: [{
					name: 'Count',
					colorByPoint: true,
					data: [{
						name: 'Healthy',
						color: 'rgba(34,139,34, .5)',
						y: $scope.plants.filter(getLivingPlants).filter(goodOrchids).length
					}, {
						name: 'Medium',
						color: 'rgba(229,217,0, .8)',
						y: $scope.plants.filter(getLivingPlants).filter(mediumOrchids).length
					}, {
						name: 'Poor',
						color: 'rgba(255,0,0, .5)',
						y: $scope.plants.filter(getLivingPlants).filter(poorOrchids).length
					}]
				}]
			});
		} else if ($scope.selectedGraph == 'Yearly Plot Health') {
			$('#graph').highcharts({
				chart: {
					type: 'column'
				},
				title: {
					text: 'Plot Health Breakdown'
				},
				xAxis: {
					categories: $scope.years,
					crosshair: true
				},
				yAxis: {
					title: {
						text: 'Number of Plants'
					},
					min: 0,
					stackLabels: {
						enabled: true,
						style: {
							fontWeight: 'bold',
							color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
						}
					}
				},
				legend: {
					align: 'right',
					x: -30,
					verticalAlign: 'top',
					y: 25,
					floating: true,
					backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
					borderColor: '#CCC',
					borderWidth: 1,
					shadow: false
				},
				tooltip: {
					headerFormat: '<b>{point.x}</b><br/>',
					pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
				},
				plotOptions: {
					column: {
						stacking: 'normal',
						dataLabels: {
							enabled: true,
							color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
							style: {
								textShadow: '0 0 3px black'
							}
						}
					}
				},
				series: [{
					name: 'Healthy',
					color: 'rgba(34,139,34, .5)',
					data: getPlantCountPerYear($scope.plants, 3)
				}, {
					name: 'Medium',
					color: 'rgba(229,217,0, .8)',
					data: getPlantCountPerYear($scope.plants, 2)
				}, {
					name: 'Poor',
					color: 'rgba(255,0,0, .5)',
					data: getPlantCountPerYear($scope.plants, 1)
				}]
			});
		}
	};
})

.controller('GridCtrl', function($scope, $ionicPopup, AuthService, Plots) {
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

	AuthService.authRequired().then(function(response) {
		$scope.authRequired = false;
	}).catch(function(err) {
		$scope.authRequired = true;
	});

	var chart;

	$scope.addPlant = function(callback) {
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
						} else if ($scope.plant.x < 0 || $scope.plant.x > 200 ||
									$scope.plant.y < 0 || $scope.plant.y > 200) {
							$scope.error = "Location must be between 0 and 200";
							e.preventDefault();
						} else if ($scope.plant.updates[0].shoots < 0) {
							$scope.error = "Number of shoots cannot be negative";
							e.preventDefault();
						} else {
							$scope.error = "";
							var startingDate = new Date().toISOString();
							$scope.plant.started = startingDate;
							$scope.plant.updates[0].updated = startingDate;
							$scope.plants.push($scope.plant);
							var total = $scope.plants.filter(getLivingPlants).length;
							chart.setTitle(null, {text: 'Orchid count: ' + total});

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
							depth: "Deep",
							parent: "A",
							comment: "",
							updates: [
								{
									health: 1,
									shoots: 0
								}
							]
						};
						$scope.plants.sort(function(a,b){return a.id-b.id});

						var largestID = 0;
						if ($scope.plants.length > 0) {
							largestID = $scope.plants[$scope.plants.length - 1].id;
						}
						$scope.plant.id = largestID + 1;

						$scope.addPlant(function() {
							var livingPlants = $scope.plants.filter(getLivingPlants);
							var goodPlants = livingPlants.filter(goodOrchids);
							var mediumPlants = livingPlants.filter(mediumOrchids);
							var badPlants = livingPlants.filter(poorOrchids);
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
				text: 'Orchid count: ' + $scope.plants.filter(getLivingPlants).length
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
									started: this.started,
									x: this.x,
									y: this.y,
									depth: this.depth,
									parentage: this.parent,
									health: this.updates[this.updates.length - 1].health,
									shoots: this.updates[this.updates.length - 1].shoots,
									comment: this.comment
								}

								$ionicPopup.show({
									templateUrl: 'templates/plant-info-dialog.html',
									title: '<h3>Plant ' + this.id + '</h3>',
									scope: $scope,
									buttons: [
										{text: 'Cancel'},
                    {
                      text:'Update',
                      type:'button-positive',
                      onTap: function(e) {
                        if ($scope.authRequired) {
													var alertPopup = $ionicPopup.alert({
														title: 'Not Signed In'
													});
													// alertPopup.then(function(res) {
													// 	plantDialog.close();
													// });
													return;
												}

                        var update = {
        									health: $scope.info.health,
        									shoots: $scope.info.shoots,
        									updated: new Date().toISOString()
        								};

                        var index = findPlantIndexById($scope.plants, $scope.info.id);
                        $scope.plants[index].updates.push(update);

                        Plots.putPlants($scope.plants, $scope.plotNumber, function(response) {
                          var livingPlants = $scope.plants.filter(getLivingPlants);
                          var goodPlants = livingPlants.filter(goodOrchids);
                          var mediumPlants = livingPlants.filter(mediumOrchids);
                          var badPlants = livingPlants.filter(poorOrchids);
                          chart.series[0].setData(goodPlants, true);
                          chart.series[1].setData(mediumPlants, true);
                          chart.series[2].setData(badPlants, true);
                        }, function(response) {
                          console.log('Error: ' + response);
                        });
                      }
                    },
										{
											text:'Remove',
											type: 'button-assertive',
											onTap: function(e) {
												if ($scope.authRequired) {
													var alertPopup = $ionicPopup.alert({
														title: 'Not Signed In'
													});
													// alertPopup.then(function(res) {
													// 	plantDialog.close();
													// });
													return;
												}

												var confirmPopup = $ionicPopup.confirm({
													title: 'Remove Plant ' + this.id,
													template: 'Are you sure you want to remove this plant?'
												});

												confirmPopup.then(function(res) {
													if(res) {
														var index = findPlantIndexById($scope.plants, $scope.info.id);
														$scope.plants[index].removed = new Date().toISOString();
														var total = $scope.plants.filter(getLivingPlants).length;
														chart.setTitle(null, {text: 'Orchid count: ' + total});

														Plots.putPlants($scope.plants, $scope.plotNumber, function(response) {
															var livingPlants = $scope.plants.filter(getLivingPlants);
															var goodPlants = livingPlants.filter(goodOrchids);
															var mediumPlants = livingPlants.filter(mediumOrchids);
															var badPlants = livingPlants.filter(poorOrchids);
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
				name: 'Healthy Plant',
				color: 'rgba(34,139,34, .5)',
				data: $scope.plants.filter(getLivingPlants).filter(goodOrchids),
				marker: {
					"symbol": "circle"
				}
			}, {
				name: 'Medium Plant',
				color: 'rgba(229,217,0, .8)',
				data: $scope.plants.filter(getLivingPlants).filter(mediumOrchids),
				marker: {
					"symbol": "circle"
				}
			}, {
				name: 'Poor Plant',
				color: 'rgba(255,0,0, .5)',
				data: $scope.plants.filter(getLivingPlants).filter(poorOrchids),
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
	return orchid.updates[orchid.updates.length - 1].health == 3;
};

function mediumOrchids(orchid) {
	return orchid.updates[orchid.updates.length - 1].health == 2;
};

function poorOrchids(orchid) {
	return orchid.updates[orchid.updates.length - 1].health == 1;
};

function getLivingPlants(plant) {
	return !plant.removed || plant.removed == "";
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

function getPlantCountPerYear(plants, health) {
	var years = getYears(plants);
	var counts = [];
	for (year in years){
		counts[year] = 0;
	}
	for (p in plants){
		var plant = plants[p];
		for (u in plant.updates) {
			var update = plant.updates[u];
			if (health) {
				if (update.health == health) {
					var year = parseInt(update.updated);
					counts[years.indexOf(year)]++;
					if (u == plant.updates.length - 1) {
						var endYear;
						if (!plant.removed || plant.removed == "") {
							endYear = parseInt(new Date().getFullYear());
							for (var i = year + 1; i <= endYear; i++) {
								counts[years.indexOf(i)]++;
							}
						} else {
							endYear = parseInt(plant.removed);
							for (var i = year + 1; i < endYear; i++) {
								counts[years.indexOf(i)]++;
							}
						}
					}
				}
			} else {
				var year = parseInt(update.updated);
				counts[years.indexOf(year)]++;
				if (u == plant.updates.length - 1) {
					var endYear;
					if (!plant.removed || plant.removed == "") {
						endYear = parseInt(new Date().getFullYear());
						for (var i = year + 1; i <= endYear; i++) {
							counts[years.indexOf(i)]++;
						}
					} else {
						endYear = parseInt(plant.removed);
						for (var i = year + 1; i < endYear; i++) {
							counts[years.indexOf(i)]++;
						}
					}
				}
			}
		}
	}
	return counts;
}

function getMediumPlantsPerYear(plants) {

}

function getPoorPlantsPerYear(plants) {

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
		callback(plotNumbers.sort(function(a,b){return a-b}))
	});
}
