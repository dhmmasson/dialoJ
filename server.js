var config      = require( './config' )  //Load config, such as port and db information
  , express     = require( 'express' )
  , app         = express()
  , http        = require( 'http' ).Server( app )  
  , bodyParser  = require( 'body-parser' )
  , multer      = require( 'multer' ) 
  , upload      = multer()					
  , mysql       = require( "mysql" ) 
  , dialojDb    = mysql.createPool( config.database )
  , morgan = require('morgan') //debug tool


app.use( morgan( 'dev' ) );
app.use( bodyParser.json() );                         // for parsing application/json
app.use( bodyParser.urlencoded({ extended: true }) ); // for parsing application/x-www-form-urlencoded
app.use( express.static( 'dist' ) );                  // serve static files from the distribution folder
app.use( '/scripts/lib/', express.static( 'bower_components' ) ); //Serve static javacript libs

app.set('view engine', 'pug');

http.listen( config.port, successListen );


app.get( '/index', renderIndexPage ) ; 



//================================================================
//INDEX PAGE
//================================================================

//Get the latest dialogies and render the form
function renderIndexPage( requete, reponse ) {
  console.log( "coucou")
  var sql = "SELECT id, description, southPole, northPole" + "\n"
          + "FROM   dialogie" + "\n"
          + "WHERE  version = 1"
  sqlPooled( { sql : sql }, processRenderIndexPage, requete, reponse ) ; 
}
//Render the page using the data from the db
function processRenderIndexPage( connection, data, requete, reponse ) {
  console.log("coucou")
  reponse.render( "index", data ) ;
  connection.release()
}

//================================================================
//mysql utility functions
//================================================================

//create pooled request, process request, then callback ( connection, data, ...args)
function sqlPooled( options, callback, ...args ) {
  dialojDb.getConnection( 
    (err, connection ) => {
      if( err ) return console.error( "sqlPooled: Can't get connection ", err ) ; 
      console.log( "connection", options, args)
      var query = connection.query( options, wrapProcessQueryCallback( callback, connection, args ) )
      console.log( query.sql )
    }
  )
}
//return a function that process errors, and insert, connection and data in the argument of the callback 
function wrapProcessQueryCallback( callback, connection,  args ) {
  return ( err, data ) => {
    console.log( "callback")
    if( err ) return console.error( "wrapProcessQueryCallback: error in sql query", err ) ;
    args.unshift( data ) ;
    args.unshift( connection ) ;
    callback.apply( this, args ) ;
  }
}
dialojDb.on('connection', function (connection) {
  console.log( "connection to database") ; 
});




//================================================================
//Express utility functions
//================================================================


//print listening port
function successListen() {
  console.log('listening on *:' + config.port); 
}