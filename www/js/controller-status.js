angular.module('starter.controllers.status', [])

.controller('StatusCtrl', function($scope, $cordovaCamera, $cordovaFile, Plots, AuthService) {
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

	function downloadOnDevice() {
		var exportDirectory = "";
		var subdir = "PlantTrackerPlots";
		if (cordova.file.documentsDirectory !== null) {
		    // iOS, OSX
		    exportDirectory = cordova.file.documentsDirectory;
		} else if (cordova.file.sharedDirectory !== null) {
		    // BB10
		    exportDirectory = cordova.file.sharedDirectory;
		} else if (cordova.file.externalRootDirectory !== null) {
		    // Android, BB10
		    exportDirectory = cordova.file.externalRootDirectory;
		} else {
		    // iOS, Android, BlackBerry 10, windows
		    exportDirectory = cordova.file.DataDirectory;
		}
		var csvString = ConvertToCSV($scope.plot);
		var filename = "plot" + $scope.plot.number + ".csv";
		var filepath = exportDirectory + subdir;

		$cordovaFile.createDir(exportDirectory, subdir, false).then(function(result){
			$cordovaFile.writeFile(filepath, filename, csvString, true).then(function(result){
				alert('Succussfully saved ' + filepath + '/' + filename);
			}, function(err) {
				alert('Failed to save file.');
			});
		}, function(err) {});
}

	$scope.download = function() {
	  var isIPad = ionic.Platform.isIPad();
	  var isIOS = ionic.Platform.isIOS();
	  var isAndroid = ionic.Platform.isAndroid();
	  var isWindowsPhone = ionic.Platform.isWindowsPhone();

		if (isAndroid || isIOS || isIPad || isWindowsPhone) {
			downloadOnDevice();
			return;
		}

		var filename = 'plot' + $scope.plot.number + '.csv';
		var content = ConvertToCSV($scope.plot);

    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
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
		var addedMay15 = false;
		var addedJuly15 = false;
		var addedMay16 = false;
		var addingJuly16 = false;

		var plant = plot.plants[i];
		var line = plant.id + "," +
			plot.number + "," +
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
				addedMay15 = true;
				continue;
			}
			if (!addedMay15) {
				line += ',';
				addedMay15 = true;
			}
			if (update.updated.indexOf("2015-07") > -1) {
				if (update.present == "Yes") {
					line += '1,';
				} else if (update.present == "No") {
					line += '0,';
				} else {
					line += ',';
				}
				line += update.leaves ? update.leaves + "," : ",";
				addedJuly15 = true;
				continue;
			}
			if (!addedJuly15) {
				line += ',,'; //present, leaf count
				addedJuly15 = true;
			}
			if (update.updated.indexOf("2016-05") > -1) {
				if (update.present == "Yes") {
					line += '1,';
				} else if (update.present == "No") {
					line += '0,';
				} else {
					line += ',';
				}
				addedMay16 = true;
				continue;
			}
			if (!addedMay16) {
				line += ',';
				addedMay16 = true;
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
				addingJuly16 = true;
				continue;
			}
			if (!addingJuly16) {
				line += ',,,,,'; //present, leaves, height, length, width
				addingJuly16 = true;
			}
		}
		str += line + '\r\n';
	}
	return str;
}
