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
		getPlants: function(id) {
			return $http.get(serverURL + '/plots/' + id + '/plants');
		},
		put: function(plot, success, error) {
			return $http.put(serverURL + '/plots/' + plot.number, plot)
							.success(success)
							.error(error);
		},
		post: function(plot, success, error) {
			return $http.post(serverURL + '/plots/' + plot.number, plot)
							.success(success)
							.error(error);
		},
		putPlants: function(plants, id, success, error) {
			return $http.put(serverURL + '/plots/' + id + '/plants', plants)
							.success(success)
							.error(error);
		}
	};
});
