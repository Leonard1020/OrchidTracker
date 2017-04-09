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

	$scope.download = function() {
		var csvString = ConvertToCSV($scope.plot);
		$cordovaFile.writeFile(cordova.file.externalRootDirectory, "plot" + $scope.plot.number + ".csv", finalCSV, true).then(function(result){
      alert('Success! Export created!');
    }, function(err) {
      console.log("ERROR");
    })
	}

	$scope.takePicture = function() {
		try {
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
		} catch (e) {
			//Camera failed
		}
	}
})

function ConvertToCSV(plot) {
	var str = "Plant Number," +
		"Plot Number," +
		"Created By," +
		"Plot Started," +
		"Plot Description," +
		"Plot Comment," +
		"Plot Latitude," +
		"Plot Longitude," +
		"Plot Light(%)," +
		"Plot Moisture(%)," +
		"Plot pH," +
		"Plant X," +
		"Plant Y," +
		"Plant Depth," +
		"Plant Parentage," +
		"Plant Surface Prep," +
		"Plant Health," +
		"Plant Shoots," +
		"May 2015 Present," +
		"July 2015 Present," +
		"July 2015 Leaves," +
		"May 2016 Present," +
		"July 2016 Present," +
		"July 2016 Leaves," +
		"July 2016 Height," +
		"July 2016 Leaf Length," +
		"July 2016 Leaf Width,\r\n";

	for (var i = 0; i < plot.plants.length; i++) {
		var plant = plot.plants[i];
		var line = plot.number + "," +
			plot.createdBy + "," +
			plot.started + "," +
			plot.description + "," +
			plot.comment + "," +
			plot.location.latitude + "," +
			plot.location.longitude + "," +
			plot.light + "," +
			plot.moisture + "," +
			plot.ph + "," +
			plant.x + "," +
			plant.y + "," +
			plant.depth + "," +
			plant.parent + "," +
			plant.surfacePrep + "," +
			plant.health + "," +
			plant.shoots + ",";
		for (var index in plant.updates) {
			var update = plant.updates[index];
			if (update.updated.indexOf("2015-05") > -1) {
				if (update.present == "Yes") {
					line += '1,';
				} else if (update.present == "No") {
					line += '0,';
				} else {
					line += ',';
				}
			}
			if (update.updated.indexOf("2015-07") > -1) {
				if (update.present == "Yes") {
					line += '1,';
				} else if (update.present == "No") {
					line += '0,';
				} else {
					line += ',';
				}
			}
			if (update.updated.indexOf("2015-07") > -1 && update.leaves) {
				line += update.leaves ? update.leaves + "," : ",";
			}
			if (update.updated.indexOf("2016-05") > -1) {
				if (update.present == "Yes") {
					line += '1,';
				} else if (update.present == "No") {
					line += '0,';
				} else {
					line += ',';
				}
			}
			if (update.updated.indexOf("2016-07") > -1) {
				if (update.present == "Yes") {
					line += '1,';
				} else if (update.present == "No") {
					line += '0,';
				} else {
					line += ',';
				}
				line += update.leaves ? update.leaves + "," : ",";
				line += update.height ? update.height + "," : ",";
				line += update.lowestLeafLength ? update.lowestLeafLength + "," : ",";
				line += update.lowestLeafWidth ? update.lowestLeafWidth + "," : ",";
			}
			if (update.updated.indexOf("2017-05") > -1) {
				if (update.present == "Yes") {
					line += '1,';
				} else if (update.present == "No") {
					line += '0,';
				} else {
					line += ',';
				}
			}
		}
		str += line + '\r\n';
	}
	return str;
}
