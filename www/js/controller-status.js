angular.module('starter.controllers.status', [])

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
