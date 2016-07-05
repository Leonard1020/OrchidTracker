var express = require('express');
var backend = require('./backend');
app = express();
app.use(express.static('www'));
app.set('port', process.env.PORT || 45101);
app.listen(app.get('port'), function () {
    console.log('Ionic server listening on port ' + app.get('port'));
	backend.startBackend();
});