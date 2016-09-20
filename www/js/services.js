angular.module('starter.services', [])

.factory('AuthService', function($firebaseAuth, $firebaseObject, $firebaseArray, $state) {
	return {/*
		signupEmail: function(newEmail, newPassword, newFullName) {
			authUser.$createUser({
				email: newEmail,
				password: newPassword,
				fullName: newFullName
			}).then(function(authData) {
				ref.child("userProfile").child(authData.uid).set({
					name: newFullName,
					email: newEmail
				});
			}).catch(function(error) {
				switch (error.code) {
					case "EMAIL_TAKEN":
						console.log("Someone's using that email");
						break;
					case "INVALID_EMAIL":
						console.log("Not a valid email address");
						break;
					default:
						console.log("Error creating user:", error);
				}
			});
		},
		*/
		loginUser: function(email, password, success, failure) {
			console.log(email);
			$firebaseAuth().$signInWithEmailAndPassword(email, password).then(function(authData) {
				success(authData);
			}).catch(function(error) {
				failure(error);
			});
			/*
			authUser.$authWithPassword({ 
				email: email,
				password: password
			}).then(function(authData) {
				$state.go('tab');
			}).catch(function(error) {
				console.log(error);
			});
			*/
		}/*,
		resetPassword: function(resetEmail){
			authUser.$resetPassword({
				email: resetEmail
			}).then(function(){
				console.log('Password Reset Email was sent successfully');
			}).catch(function(error){
				console.log(error);
			});
		}*/
	};
})

.factory('Plots', function($http, $firebaseArray, $firebaseObject) {
	var serverURL = "https://orchid-tracker-server.herokuapp.com";
	var dbURL = "https://plant-tracker-587e0.firebaseio.com";
	
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
		add: function(plot, success, error) {
			var ref = firebase.database().ref().child('plots').child(plot.number).set(plot);
			$firebaseObject(ref).then(function(plot) {
				success(plot);
			}).catch(function(err) {
				console.log('ere')
				error(err);
			});
		},
		update: function(plot, success, error) {
			plot.$save().then(function(plot) {
				success(plot)
			}).catch(function(err) {
				error(err);
			});
		},
		putPlants: function(plants, id, success, error) {
			return $http.put(serverURL + '/plots/' + id + '/plants', plants)
							.success(success)
							.error(error);
		}
	};
})
