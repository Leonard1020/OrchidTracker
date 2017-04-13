angular.module('starter.services', [])

.factory('AuthService', function($firebaseAuth, $firebaseObject, $firebaseArray, $state) {
	return {
		authRequired: function() {
			return $firebaseAuth().$requireSignIn();
		},
		getUser: function() {
			return $firebaseAuth().$getAuth().email;
		},
		logout: function() {
			return $firebaseAuth().$signOut();
		},
		loginUser: function(email, password, success, failure) {
			$firebaseAuth().$signInWithEmailAndPassword(email, password).then(function(authData) {
				success(authData);
			}).catch(function(error) {
				failure(error);
			});
		},
		createUser: function(email, password, success, failure) {
			$firebaseAuth().$createUserWithEmailAndPassword(email, password).then(function(firebaseUser) {
				success(firebaseUser);
			}).catch(function(error) {
				failure(error);
			});
		},
		resetPassword: function(email, success, failure){
			$firebaseAuth().$sendPasswordResetEmail(email).then(function(firebaseUser) {
				success(firebaseUser);
			}).catch(function(error) {
				failure(error);
			});
		},
		signInWithGoogle: function(success, failure) {
			$firebaseAuth().$signInWithPopup("google").then(function(result) {
				success(result);
			}).catch(function(error) {
				failure(error);
			});
		}
	};
})

.factory('Plots', function($http, $firebaseAuth, $firebaseArray, $firebaseObject) {
	return {
		all: function() {
			var ref = firebase.database().ref().child('plots');
			return $firebaseArray(ref);
		},
		get: function(id) {
			var ref = firebase.database().ref().child('plots').child(id);
			return $firebaseObject(ref);
		},
		getPlants: function(id) {
			var ref = firebase.database().ref().child('plots').child(id);
			return $firebaseObject(ref).$loaded().then(function(plot) {
				return plot.plants;
			});
		},
		add: function(plot, callback) {
			plot.createdBy = $firebaseAuth().$getAuth().email;
			var ref = firebase.database().ref().child('plots').child(plot.number).set(plot);
			$firebaseObject(ref).then(function(plot) {
				callback(plot);
			});
		},
		update: function(plot, success, error) {
			plot.$save().then(function(plot) {
				success(plot)
			}).catch(function(err) {
				error(err);
			});
		},
		putPlants: function(plants, id, success, failure) {
			var ref = firebase.database().ref().child('plots').child(id);
			$firebaseObject(ref).$loaded().then(function(plot) {
				plot.plants = plants;
				plot.$save().then(function(plot) {
					success(plot)
				});
			}).catch(function(error) {
				failure(error);
			});
		},
		putPicture: function(imageData, plotNumber, success, failure) {
			var storageRef = firebase.storage().ref().child('images');
			var uploadTask = storageRef.child('plot' + plotNumber + '.jpg').putString(imageData, 'data_url').then(function(snapshot) {
			  success(snapshot);
			}).catch(function(error) {
				failure(error);
			});
		}
	};
})
