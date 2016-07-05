angular.module('starter.services', [])

.factory('Plots', function($http) {
	return {
		all: function() {
			return $http.get('/plots');
		},
		get: function(id) {
			return $http.get('/plots/' + id);
		},
		getNumbers: function() {
			return $http.get('/plots/numbers');
		},
		put: function(plot, success, error) {
			return $http.put('plots/' + plot.number, plot)
							.success(success)
							.error(error);
		}
	};
});
