var fs = require( 'fs' );
var cp = require( 'child_process' );

var serverFile = 'fitMachMit.js';

var server = cp.fork( serverFile );
console.log( 'Server script gestartet!' );

fs.watchFile( serverFile, function( event, filename ){
	server.kill();
	console.log( 'Server gestoppt!' );
	server = cp.fork( serverFile );
	console.log( 'Neues Server-Script gestartet!' );
} );