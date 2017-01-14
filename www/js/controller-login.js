angular.module('starter.controllers.login', [])

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
