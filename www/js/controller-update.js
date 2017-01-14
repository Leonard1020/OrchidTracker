angular.module('starter.controllers.update', [])

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
