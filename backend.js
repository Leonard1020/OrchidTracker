var http = require('http');
var express = require('express');
var bodyParser = require('body-parser')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
	
var app = express();

app.use(bodyParser.json())

app.set('port', process.env.PORT || 45103);

//var url = 'mongodb://collector:Ridges@localhost:27017/orchid';
var url = 'mongodb://collector:Ridges@ds015325.mlab.com:15325/heroku_xj0dlmr8'

var findPlots = function(db, callback) {
	var plots = [];
	var docs = db.collection('plots').find();
	docs.each(function(err, doc) {
		if (err) throw err;
		doc != null ? plots.push(doc) : callback(plots);
	});
};

var findPlot = function(db, id, callback) {
	db.collection('plots').findOne({"number":Number(id)}, function(err, item){
		if (err) throw err;
		callback(item);
	});
};

var updatePlot = function(db, plot, callback) {
	plot._id = ObjectId(plot._id);
	db.collection('plots').replaceOne({'_id': plot._id}, plot, function(err, result) {
		if( err || !result ) console.log("Not updated");
		callback(result);
	});
};

var findNumbers = function(db, callback) {
	var plotNumbers = [];
	var docs = db.collection('plots').find({}, {number: 1});
	docs.each(function(err, doc) {
		if (err) throw err;
		doc != null ? plotNumbers.push(doc.number) : callback(plotNumbers);
	});
};

app.get('/', function (req, res) {
	res.redirect("/plots");
});

app.get('/plots', function (req, res) {
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		findPlots(db, function(plots) {
			res.send(plots);
			db.close();
		});
	});
});

app.get('/plots/numbers', function (req, res) {
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		findNumbers(db, function(numbers) {
			res.send(numbers);
			db.close();
		})
	})
})

app.get('/plots/:id', function (req, res) {
	var id = req.params.id;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		findPlot(db, id, function(plot) {
			res.send(plot);
			db.close();
		});
	});
});

app.put('/plots/:id', function (req, res) {
	var id = req.params.id;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		updatePlot(db, req.body, function(response) {
			res.send(response);
			db.close();
		});
	});
});

var startServer = function() {
	http.createServer(app).listen(app.get('port'), function(){
		console.log('Orchid server listening on port ' + app.get('port'));
	});
};

module.exports = {
  startBackend: startServer
}