angular.module('starter.controllers.nav', [])

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
