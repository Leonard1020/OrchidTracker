angular.module('starter.controllers', [])

.controller('NavCtrl', function($scope, $rootScope, $ionicPopup, $location, $mdDialog, $ionicHistory, $window, $state, AuthService, Plots) {
	$scope.plotNumbers = [];
	getPlotNumbers(Plots.all(), function(array) {
		$scope.plotNumbers = array;
	});

  $rootScope.$on('plotAdded', function(event, args) {
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
			$("#addPlotButton").hide();
			$("#loginButton").hide();
			$("#logoutButton").hide();
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
		$scope.error = "";

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

		$ionicPopup.show({
			templateUrl: 'templates/add-plot-dialog.html',
			title: '<h3>Add a Plot</h3>',
			scope: $scope,
			buttons: [
				{ text: 'Cancel' },
				{ text: 'Create',
					type: 'button-positive',
					onTap: function(e) {
		        if ($scope.plotNumbers.find(function(index) { return index.number == $scope.plot.number; })) {
		          $scope.error = "Plot " + $scope.plot.number + " already exists";
							e.preventDefault();
		        } else if ($scope.plot.number < 1) {
		          $scope.error = "Invalid Plot Number";
							e.preventDefault();
						} else if ($scope.plot.location.latitude == '' || $scope.plot.location.longitude == '') {
							$scope.error = "Please enter plot coordinates";
							e.preventDefault();
						} else if ($scope.plot.location.latitude < -90 || $scope.plot.location.latitude > 90) {
		          $scope.error = "Latitude must be between -90 and 90";
							e.preventDefault();
		        } else if ($scope.plot.location.longitude < -180 || $scope.plot.location.longitude > 180) {
		          $scope.error = "Longitude must be between -180 and 180";
							e.preventDefault();
		        } else {
		          var date = new Date().toISOString();
		          $scope.plot.started = date;
		          $scope.plot.updated = date;
		          $rootScope.$emit('plotAdded', {});

		          try {
		            Plots.add($scope.plot, function(response) {
									$scope.error = "";
		              localStorage.setItem('selectedPlot', $scope.plot.number)
		              $state.go('tab.status', null, {reload: true});
		            }).error(function(err) {
		              $scope.error = err.message;
									e.preventDefault();
		            });
		          } catch (err) {
		            if (err.code == 'PERMISSION_DENIED') {
		              $scope.error = "Permission Denied";
									e.preventDefault();
		            } else if (err.message.indexOf("'key'") > -1) {
									$scope.error = "";
		              localStorage.setItem('selectedPlot', $scope.plot.number)
		              getPlotNumbers(Plots.all(), function(array) {
		                  $scope.plotNumbers = array;
		              });
		              $state.go('tab.status', null, {reload: true});
		            }
		          }
		        }
		      }
				}
			]
		});
	};
})

.controller('LoginCtrl', function($scope, $mdDialog, $ionicPopup, $window, $state, AuthService) {
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
		$scope.data = {
			email: ''
		};
		$ionicPopup.show({
			templateUrl: 'templates/resetPassword.html',
			title: '<h3>Reset Password</h3>',
			scope: $scope,
			buttons: [
				{ text: 'Cancel',
			 		onTap: function(e) {
						$scope.error = '';
						$scope.data.email = '';
					}
				},
				{ text: 'Send',
					type: 'button-positive',
					onTap: function(e) {
						if (!$scope.data.email || $scope.data.email == '') {
		          $scope.error = "Enter a valid email";
							e.preventDefault();
		        }
		        AuthService.resetPassword($scope.data.email, function(user) {
		          $scope.error = "";
		        }, function(error) {
		          $scope.error = error.message;
							e.preventDefault();
		        });
					}
				}
			]
		});
  };

  $scope.openCreateUserDialog = function() {
		$scope.error = '';
		$scope.newUser = {
			email: '',
			password: '',
			secondPassword: ''
		};
		var createUserPopup = $ionicPopup.show({
			templateUrl: 'templates/createUser.html',
			title: '<h3>Create User</h3>',
			scope: $scope,
			buttons: [
				{ text: 'Cancel',
			 		onTap: function(e) {
						$scope.error = '';
					}
				},
				{ text: 'Create',
					type: 'button-positive',
					onTap: function(e) {
						if (!$scope.newUser.email || $scope.newUser.email == '' || $scope.newUser.email == undefined) {
		          $scope.error = "Enter a valid email";
							e.preventDefault();
							return;
		        }
						if (!$scope.newUser.password || $scope.newUser.password == '') {
		          $scope.error = "Enter a password";
		          e.preventDefault();
							return;
		        }
		        if ($scope.newUser.password != $scope.newUser.secondPassword) {
		          $scope.error = "Passwords do not match";
		          e.preventDefault();
							return;
		        }

						$('#createUserCircle').show();
		        AuthService.createUser($scope.newUser.email, $scope.newUser.password, function(user) {
		          $('#createUserCircle').hide();
		          $scope.error = "";
		          $state.go('tab.status', null, {reload: true});
		          $window.location.reload(true);
							createUserPopup.close();
		        }, function(error) {
							$('#createUserCircle').hide();
		          $scope.error = error.message;
		        });
						e.preventDefault();
					}
				}
			]
		});
  };
})

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
					var date = $scope.data.find(point => point.x == time);

					if (date) {
						date.y++;
					} else {
						$scope.data.push({x: time, y: 1});
					}
				}
			}
			$scope.data.sort(function(a,b){
			  return new Date(b.x) - new Date(a.x);
			});
			$scope.data = [$scope.data];
		  $scope.options = {
		    scales: {
					xAxes: [
						{
							type: 'time',
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

.controller('StatusCtrl', function($scope, Plots, AuthService) {
	AuthService.authRequired().then(function(response) {
		$scope.authRequired = false;
		$scope.padding = {
			top: 0,
			bottom: 0
		};
	}).catch(function(err) {
		$scope.authRequired = true;
	});

	Plots.get(localStorage.getItem('selectedPlot')).$loaded().then(function(plot) {
		$scope.plot = plot;
		if (!plot.plants) {
			$scope.plot.plants = [];
		}
		$scope.plantCount = plot.plants.filter(getPresentPlants).length;
	});

	$scope.takePicture = function() {
		var options = {
	    quality : 75,
	    destinationType : Camera.DestinationType.DATA_URL,
	    sourceType : Camera.PictureSourceType.CAMERA,
	    allowEdit : true,
	    encodingType: Camera.EncodingType.JPEG,
	    targetWidth: 300,
	    targetHeight: 300,
	    popoverOptions: CameraPopoverOptions,
	    saveToPhotoAlbum: false
    };

    $cordovaCamera.getPicture(options).then(function(imageData) {
    	$scope.imgURI = "data:image/jpeg;base64," + imageData;
    }, function(err) {
      // An error occured. Show a message to the user
    });
	}
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
						} else if ($scope.plant.updates[0].shoots < 0) {
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
							updates: [
								{
									health: 1,
									height: 0,
									shoots: 0,
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
							var livingPlants = $scope.plants.filter(getPresentPlants);
							var goodPlants = livingPlants.filter(getGoodPlants);
							var mediumPlants = livingPlants.filter(getMediumPlants);
							var badPlants = livingPlants.filter(getPoorPlants);
							var missingPlants = $scope.plants.filter(getNonPresentPlants);
							chart.series[0].setData(goodPlants, true);
							chart.series[1].setData(mediumPlants, true);
							chart.series[2].setData(badPlants, true);
							chart.series[3].setData(missingPlants, true);
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
											update.health = binding.health != null ? binding.health : 1;
											update.height = binding.height != null ? binding.height : "";
											update.shoots = binding.shoots != null ? binding.shoots : "";
											update.leaves = binding.leaves != null ? binding.leaves : "";
											update.lowestLeafWidth = binding.lowestLeafWidth != null ? binding.lowestLeafWidth : "";
											update.lowestLeafLength = binding.lowestLeafLength != null ? binding.lowestLeafLength : "";
										}

										var index = findPlantIndexById($scope.plants, $scope.info.id);
										$scope.plants[index].updates.push(update);
										var total = $scope.plants.filter(getPresentPlants).length;
										chart.setTitle(null, {text: 'Plant count: ' + total + "/" + $scope.plants.length});

										Plots.putPlants($scope.plants, $scope.plotNumber, function(response) {
											var livingPlants = $scope.plants.filter(getPresentPlants);
											var goodPlants = livingPlants.filter(getGoodPlants);
											var mediumPlants = livingPlants.filter(getMediumPlants);
											var badPlants = livingPlants.filter(getPoorPlants);
											var missingPlants = $scope.plants.filter(getNonPresentPlants);
											chart.series[0].setData(goodPlants, true);
											chart.series[1].setData(mediumPlants, true);
											chart.series[2].setData(badPlants, true);
											chart.series[3].setData(missingPlants, true);
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
			series: [{
				name: 'Healthy Plant',
				color: 'rgba(34,139,34, .5)',
				data: $scope.plants.filter(getPresentPlants).filter(getGoodPlants),
				marker: {
					"symbol": "circle"
				}
			}, {
				name: 'Medium Plant',
				color: 'rgba(229,217,0, .8)',
				data: $scope.plants.filter(getPresentPlants).filter(getMediumPlants),
				marker: {
					"symbol": "circle"
				}
			}, {
				name: 'Poor Plant',
				color: 'rgba(255,0,0, .5)',
				data: $scope.plants.filter(getPresentPlants).filter(getPoorPlants),
				marker: {
					"symbol": "circle"
				}
			}, {
				name: 'Not Present',
				color: 'rgba(100,100,100, .5)',
				data: $scope.plants.filter(getNonPresentPlants),
				marker: {
					"symbol": "diamond"
				}
			}]
		});

		chart = grid.highcharts();
	});

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
	return plant.updates[plant.updates.length - 1].health == 3;
};

function getMediumPlants(plant) {
	return plant.updates[plant.updates.length - 1].health == 2;
};

function getPoorPlants(plant) {
	return plant.updates[plant.updates.length - 1].health == 1;
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
		callback(plotNumbers.sort(function(a,b){return a-b}))
	});
}
