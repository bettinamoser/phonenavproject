/* Server für fit mach mit oder auch nicht */
var http = require( 'http' );   // HTTP Funktionen 
var fs = require( 'fs' );       // Dateisystem-Funktionen
var express = require( 'express' );
var bp = require( 'body-parser' );
var app = express();

var doLog = true;

var nameFile = 'projects.json';
var projectNames = [];     // json {projects:[{name:'',fileName:'',code:''}]};

var getProjectNameData = function( pName ){
	for (var i = 0; i < projectNames.length; i++){
		if (projectNames[i].name == pname) return projectNames[i];
	}
	return null;
};
var getProjectNameIndex = function( pName ){
	for (var i = 0; i < projectNames.length; i++){
		if (projectNames[i].name == pname) return i;
	}
	return -1;
};

var readProjectData = function( fn ){       // {marker:[{name:'',lat:number,lng:number},..]}
	var pd = null;
	fs.readFile( fn, function( err, data ){
		try{
			if (!err){
				pd = JSON.parse( data );
				if ( doLog ) console.log( 'Projektdatei '+ fn +' geladen!');
			} else { 
				console.log( 'Kann Projektdatei '+ fn +' nicht laden : ', err );
				pd = null;
			}
		} catch ( e ) {
			pd = null;
		}
	});
	return pd;
};

var builtProjectsData = function(){
	var pds = [];
	var pd;
	for (var i = 0; i < projectNames.length; i++){
		pd = {name:projectNames[i].name,code:projectNames[i].code};
		pds.push( pd );
	}
	return { projects : pds };
};

var getNewCode = function(){
	return Math.trunc( Math.random() * 10000 ) + '';
}

var getUserId = function(){
	return Math.trunc( Math.random() * 1000000 ) + '';
}

var nameFileExists = false;

fs.exists( nameFile, function( exists ){
	nameFileExists = exists;
});
console.log( 'projectNames-file existsiert: ' + nameFileExists );
try{
	fs.readFile( nameFile, function( err, data ){
		try{
			if (!err){
				projectNames = JSON.parse( data ).projects;
				if ( doLog ) console.log( 'Projektedatei geladen' );
			} else { 
				console.log( 'Kann Projektedatei nicht laden : ', err );
			}
		} catch ( e ) {
			projectNames = [];
		}
	});
} catch ( e ) {
	console.log( 'Kann Projektedatei nicht laden : ', e );
};

var server = app.listen( 20001, function(){
	var host = server.address().host;
	var port = server.address().port;
	console.log( 'Server listen at http://localhost:%s', port );
} );

app.use( bp.urlencoded({extended:true}) );

var writeProjectNames = function( cb ){
	fs.writeFile( nameFile, JSON.stringify( {projects :projectNames } ), function( err ){
		cb( err );
	} );
};

var writeProjectData = function( fn, data, cb ){
	fs.writeFile( fn, JSON.stringify( data ), function( err ){
		cb( err );
	} );
};

app.use( function( req, res, next ){
	res.setHeader( 'Access-Control-Allow-Origin', '*' );
	res.setHeader( 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE' );
	next();
});

// GET Projects
app.get( '/getProjects', function( req, res ){
	res.writeHead( 200, {'Content-Type':'text/plain'} ); 
	res.end( JSON.stringify( builtProjectsData() ) );				
});

// POST Project
app.post( '/login', function( req, res ){
//	console.log( req ); 
	if ( !req.body['user'] || !req.body['pw'] ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Es fehlen Daten im Request!' );				
		return;
	};
	if ( (req.body.user == 'admin') && (req.body.pw == 'admin') ){
		res.writeHead( 200, {'Content-Type':'text/plain'} ); 
		res.end( 'Du darfst!',{id: getUserId()} );				
	} else {
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Du darfst nicht!' );				
	}
});


// POST Project
app.post( '/getProject', function( req, res ){
	if ( !req.body.name || !req.body.code ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Es fehlen Daten im Request!' );				
		return;
	};
	var pname = req.body.name;
	var pcode = req.body.code;
	var pndata = getProjectNameData( pname );
	var pdata;
	if (pndata != null){
		if (pndata.code == pcode ){
			pdata = readProjectData( pndata.fileName );
			if (pdata != null){
				res.writeHead( 200, {'Content-Type':'text/plain'} ); 
				res.end( JSON.stringify( { markers: pdata } ) );				
			} else {
				res.writeHead( 404, {'Content-Type':'text/plain'} ); 
				res.end( 'Daten nicht verfügbar!' );				
			}
		} else {
			res.writeHead( 404, {'Content-Type':'text/plain'} ); 
			res.end( 'Ungültiger Code' );				
		}
	}
});

var builtProjectFileName = function( pname ){
	return pname.replace(/\s/g, '_') + '.json';
};

// POST
app.post( '/createProject', function( req, res ){
	console.log( req.body );
	if ( !req.body.name ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Kein Projektname!' );				
		return;
	};
	var pName = req.body.name;
	var pnd = getProjectNameData(pName);
	if ( pnd != null){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Projekt existiert bereits!' );				
		return;
	}
	// write empty project data file
	var pnd = {name: pName,fileName:builtProjectFileName( pName ),code: getNewCode() };
	writeProjectData( pnd.fileName, {marker:[]}, function( err ){
		if(!err){
			console.log( 'write pndata : success' );
			wPnData();
			return;
		} else {
			res.writeHead( 404, {'Content-Type':'text/plain'} ); 
			res.end( 'Kann Daten nicht speichern' );			
			return;
		}
	});
	var wPnData = function(){
		projectNames.push( pnd );		
		// write projectNames data
		writeProjectNames( function( err ){
			if(!err){
				res.writeHead( 200, {'Content-Type':'text/plain'} ); 
				res.end( JSON.stringify( { code:pnd.code } ) );				
			} else {
				res.writeHead( 404, {'Content-Type':'text/plain'} ); 
				res.end( 'Kann Daten nicht speichern' );
				fs.unlink( pnd.fileName, function( err ){ return; });
			}
		});
	};
});

var findMarker = function( mName, pData ){
	for (var i = 0; i < pData.marker.length; i++){
		if (pData.marker[i].name == mName) return pData.marker[i];
	};
	return null;
}
var getMarkerIndex = function( mName, pData ){
	for (var i = 0; i < pData.marker.length; i++){
		if (pData.marker[i].name == mName) return i;
	};
	return -1;
}

// POST create a Marker for a project
app.post( '/createMarker',function( req, res ){
	if ( !req.body.project || !req.body.name || !req.body.lat || !req.body.lng){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Es fehlen Daten im Request!' );				
		return;
	};
	var pname = req.body.project;
	var md = {name:req.body.name,lat:req.body.lat,lng:req.body.lng};
	var pnd = getProjectNameData( pName );
	if ( pnd == null){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Unbekanntes Project!' );				
		return;
	};
	var pd = readProjectData( pnd.fileName );
	if ( pd == null ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Kann Projektdaten nicht lesen!' );				
		return;
	}
	var md1 = findMarker( md.name, pd );
	if ( md1 != null ) {
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Marker existsiert bereits!' );				
		return;
	};
	pd.marker.push( md );
	writeProjectData( pnd.fileName, pd, function( err ){
		if(!err){
			res.writeHead( 200, {'Content-Type':'text/plain'} ); 
			res.end( JSON.stringify( {created:true} ) );				
		} else {
			res.writeHead( 404, {'Content-Type':'text/plain'} ); 
			res.end( 'Daten nicht gespeicht!' );			
			return;
		}
	});
});

// modify project
app.put( '/project', function ( req, res ){
	if ( !req.body.oldName || !req.body.newName ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Es fehlen Daten im Request!' );				
		return;
	};
	var oldName = req.body.oldName;
	var newName = req.body.newName;
	var pndi = getProjectNameIndex( oldName );
	if ( pndi == -1 ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Unbekanntes Project!' );				
		return;
	};
	var pnd = projectNames[pndi];
	pnd.name = newName;
	projectNames[pndi] = pnd;
	// write projectNames data
	writeProjectNames( function( err ){
		if(!err){
			res.writeHead( 200, {'Content-Type':'text/plain'} ); 
			res.end( 'Projektname geändert!' );				
		} else {
			res.writeHead( 404, {'Content-Type':'text/plain'} ); 
			res.end( 'Kann Änderungen nicht speichern' );
		}
	});
});

// PUT modify a Marker
app.put( '/marker',function( req, res ){
	if ( !req.body.project || !req.body.name || !req.body.lat || !req.body.lng){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Es fehlen Daten im Request!' );				
		return;
	};
	var pname = req.body.project;
	var md = {name:req.body.name,lat:req.body.lat,lng:req.body.lng};
	var pnd = getProjectNameData( pName );
	if ( pnd == null){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Unbekanntes Project!' );				
		return;
	};
	var pd = readProjectData( pnd.fileName );
	if ( pd == null ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Kann Projektdaten nicht lesen!' );				
		return;
	}
	var mdi = getMarkerIndex( md.name, pd );	
	if ( mdi == -1 ) {
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Marker existsiert nicht!' );				
		return;
	};
	pd.marker[mdi] = md;
	writeProjectData( pnd.fileName, pd, function( err ){
		if(!err){
			res.writeHead( 200, {'Content-Type':'text/plain'} ); 
			res.end( 'Daten geändert!' );				
		} else {
			res.writeHead( 404, {'Content-Type':'text/plain'} ); 
			res.end( 'Daten nicht geändert!' );			
			return;
		}
	});
});
// PUT modify a Marker name
app.put( '/marker',function( req, res ){
	if ( !req.body.project || !req.body.oldName || !req.body.newName ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Es fehlen Daten im Request!' );				
		return;
	};
	var pname = req.body.project;
//	var md = {name:req.body.name,lat:req.body.lat,lng:req.body.lng};
	var pnd = getProjectNameData( pName );
	if ( pnd == null){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Unbekanntes Project!' );				
		return;
	};
	var pd = readProjectData( pnd.fileName );
	if ( pd == null ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Kann Projektdaten nicht lesen!' );				
		return;
	}
	var mdi = getMarkerIndex( req.body.oldName, pd );	
	if ( mdi == -1 ) {
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Marker existsiert nicht!' );				
		return;
	};
	pd.marker[mdi].name = req.body.newName;
	writeProjectData( pnd.fileName, pd, function( err ){
		if(!err){
			res.writeHead( 200, {'Content-Type':'text/plain'} ); 
			res.end( 'Daten geändert!' );				
		} else {
			res.writeHead( 404, {'Content-Type':'text/plain'} ); 
			res.end( 'Daten nicht geändert!' );			
			return;
		}
	});
});

// delete project
app.delete( '/project', function ( req, res ){
	if ( !req.body.name ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Es fehlen Daten im Request!' );				
		return;
	};
	var pName = req.body.name;
	var pndi = getProjectNameIndex( oldName );
	if ( pndi == -1 ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Unbekanntes Project!' );				
		return;
	};
	var pnd = projectNames[pndi];
	fs.unlink( pnd.fileName, function(){ return; });
	projectNames.splice( pndi,1 );
	// write projectNames data
	writeProjectNames( function( err ){
		if(!err){
			res.writeHead( 200, {'Content-Type':'text/plain'} ); 
			res.end( 'Projekt gelöscht!' );				
		} else {
			res.writeHead( 404, {'Content-Type':'text/plain'} ); 
			res.end( 'Kann Änderungen nicht speichern!' );
		}
	});
});

// DELETE a Marker
app.delete( '/marker',function( req, res ){
	if ( !req.body.project || !req.body.name ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Es fehlen Daten im Request!' );				
		return;
	};
	var pname = req.body.project;
//	var md = {name:req.body.name,lat:req.body.lat,lng:req.body.lng};
	var pnd = getProjectNameData( pName );
	if ( pnd == null){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Unbekanntes Project!' );				
		return;
	};
	var pd = readProjectData( pnd.fileName );
	if ( pd == null ){
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Kann Projektdaten nicht lesen!' );				
		return;
	}
	var mdi = getMarkerIndex( req.body.oldName, pd );	
	if ( mdi == -1 ) {
		res.writeHead( 404, {'Content-Type':'text/plain'} ); 
		res.end( 'Marker existsiert nicht!' );				
		return;
	};
	pd.marker.splice( mdi, 1);
	writeProjectData( pnd.fileName, pd, function( err ){
		if(!err){
			res.writeHead( 200, {'Content-Type':'text/plain'} ); 
			res.end( 'Marker gelöscht!' );				
		} else {
			res.writeHead( 404, {'Content-Type':'text/plain'} ); 
			res.end( 'Daten nicht geändert!' );			
			return;
		}
	});
});

