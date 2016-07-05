angular.module('starter.services', [])

.factory('Plots', function($http) {
	var serverURL = "https://orchid-tracker-server.herokuapp.com";
	
	return {
		all: function() {
			return $http.get(serverURL + '/plots');
		},
		get: function(id) {
			return $http.get(serverURL + '/plots/' + id);
		},
		getNumbers: function() {
			return $http.get(serverURL + '/plots/numbers');
		},
		put: function(plot, success, error) {
			return $http.put(serverURL + 'plots/' + plot.number, plot)
							.success(success)
							.error(error);
		}
	};
});
