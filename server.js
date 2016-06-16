var config      = require( './config' )  //Load config, such as port and db information
  , express     = require( 'express' )
  , app         = express()
  , http        = require( 'http' ).Server( app )  
  , cookieParser = require('cookie-parser')
  , bodyParser  = require( 'body-parser' )
  , multer      = require( 'multer' ) 
  , upload      = multer()					
  , mysql       = require( "mysql" ) 
  , dialojDb    = mysql.createPool( config.database )
  , morgan      = require('morgan') //debug tool
  , jwt = require('jsonwebtoken')
  , readCsv     = require('./readCsv') ; 


app.set('secret', config.secret); //set the secret there, why not use config.secret I wouldn't know... 
app.use( morgan( 'dev' ) );
app.use( cookieParser() )
app.use( bodyParser.json() );                         // for parsing application/json
app.use( bodyParser.urlencoded({ extended: true }) ); // for parsing application/x-www-form-urlencoded
app.use( express.static( 'dist' ) );                  // serve static files from the distribution folder
app.use( '/scripts/lib/', express.static( 'bower_components' ) ); //Serve static javacript libs

app.set('view engine', 'pug');

http.listen( config.port, successListen );

app.get( '/', renderLoginPage ) ; 

app.post('/register', upload.array(), register ) ;

app.get( '/form', checkAuthentication, renderFormPage ) ; 

app.get( '/install/:filename', getInstallDialogie  ) 

app.post( '/validation', checkAuthentication, upload.array(), processValidation )

//================================================================
//Login et register
//================================================================
function renderLoginPage( requete, reponse ) {
  reponse.render( "login" )
}

function register( requete, reponse ) {
  //Test if user exist 
  requete.user = {
      nom : requete.body.nom || "_Onyme"
    , prenom : requete.body.prenom || "_Anne"
    , email :  requete.body.email || ""
  }   
  var sql = 'SELECT * FROM user WHERE email = ?' ;
  sqlPooled( { sql : sql, values : requete.user.email }, processUpdateOrCreateUser, requete, reponse ) ; 
} 

function processUpdateOrCreateUser( connection, rows, requete, reponse ) {
  if( rows.length > 0 ) {
    requete.user.id = rows[0].id ;   
    connection.release() ;
    finishRegistration( requete, reponse ) ;  
  } else {
    sqlPooled( { sql : 'INSERT INTO user SET ?', values : requete.user }, processNewUser, requete, reponse ) ; 
  }
}

function processNewUser( connection, rows, requete, reponse ){
  connection.release() ;
  requete.user.id = rows.insertId
  finishRegistration( requete, reponse ) ; 
}

function finishRegistration( requete, reponse ){
  token=jwt.sign( { user : requete.user }
                , app.get('secret')
                , { expiresIn: "24h" // expires in 24 hours    
                } ) ;
  reponse.cookie( 'token', token );
  reponse.redirect('/form')
}

//================================================================
//Authentication
//================================================================

function checkAuthentication(requete, reponse, next) {
  // check header or url parameters or post parameters for token
  var token = requete.body.token || requete.query.token || requete.headers['x-access-token'] || requete.cookies.token;
  requete.token = token ; 
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, app.get('secret'), wrapProcess( authenticationValid, authenticationInvalid, requete, reponse, next ));
  } else {
    // if there is no token
    // return an error
    noTokenFound( requete, reponse ) ;     
  }
}

function noTokenFound( requete, reponse ) {
  return reponse.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
}

function authenticationInvalid( err, requete, reponse, next ) {
  return reponse.status(403).json({ success: false, message: 'Failed to authenticate token.' + err.message });    
}

function authenticationValid(requete, reponse, next, decoded ) {
  requete.decoded = decoded;    
  next();
}





//================================================================
//Form PAGE
//================================================================

//Get the latest dialogies and render the form
function renderFormPage( requete, reponse ) {
  var sql = "SELECT id, description, southPole, northPole" + "\n"
          + "FROM   dialogie" + "\n"
          + "WHERE  version = ( SELECT MAX( version ) FROM dialogie LIMIT 1 )" + ";\n"
          + "SELECT id, description, type"+ "\n"
          + "FROM   metrique" + "\n"
          + "WHERE  version = ( SELECT MAX( version ) FROM metrique LIMIT 1 )" + ";\n"
  sqlPooled( { sql : sql }, processrenderFormPage, requete, reponse ) ; 
}
//Render the page using the data from the db
function processrenderFormPage( connection, data, requete, reponse ) {  
  console.log( data )
  reponse.render( "index",  { dialogies : data[0]
                            , metriques : data[1]  
                            , token     : requete.token 
                            } ) ;
  connection.release()
}

//================================================================
//Validation
//================================================================
function processValidation( requete, reponse ) {
  console.log( requete.body ) ; 

  var values    = requete.body.values
    , metriques = requete.body.metriques 
    , user_id   = requete.decoded.user.id ; 

  for( var i = 0 ; i < values.length ; i ++ ){
    value = values[ i ]
    values[ i ] = [ value.dialogie_id, user_id, value.value ] 
  }
  for( var i = 0 ; i < metriques.length ; i ++ ){
    value = metriques[ i ]
    metriques[ i ] = [ value.dialogie_id, value.metrique_id, user_id, value.value ] 
  }
  var sql = "INSERT INTO vote( dialogie_id, user_id, value ) VALUES ? ;\n"
          + "INSERT INTO evaldialogie( dialogie_id, metrique_id, user_id, value ) VALUES ? \n"

  sqlPooled( {sql : sql, values : [ values, metriques ] }, processValidationCb, requete, reponse ) 
}
function processValidationCb( connection, data, requete, reponse ) {
  console.log( data )
  connection.release() 
  reponse.json( {success: true })
}

//================================================================
//install dialogie
//================================================================
function getInstallDialogie( requete, reponse ) {
  //getLatestversion
  var sql = "SELECT MAX( version ) as version FROM dialogie "
  sqlPooled( sql, loadCSV, requete, reponse ) ;

}
function loadCSV( connection, data, requete, reponse ) {
  console.log( data[0].version ) ; 
  requete.version = data[0].version + 1  ; 
  connection.release() ; 
  readCsv.read(  "res/" + requete.params.filename , processReadDialogies, requete, reponse  )
}
function processReadDialogies( data, requete, reponse ) { 
  var sql = "INSERT INTO dialogie( position, description, southPole, northPole, version ) " + "\n"
          + "VALUES ? ";
  for( var i = 0 ; i < data.length ; i++ ){
    data[i].push( requete.version )
  }
  sqlPooled(  { sql : sql 
              , values : [data] 
              }
            , renderInstallDialogie
            , requete
            , reponse
            )
}
function renderInstallDialogie( connection, data, requete, reponse ) {
  reponse.json( {success : true, data : data })
}


//================================================================
//mysql utility functions
//================================================================

//create pooled request, process request, then callback ( connection, data, ...args)
function sqlPooled( options, callback, ...args ) {
  dialojDb.getConnection( 
    (err, connection ) => {
      if( err ) return console.error( "sqlPooled: Can't get connection ", err ) ; 
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
function wrapProcess( callBackSuccess, callBackError, ...args ) {
  return ( err, data ) => { 
    if( err ) 
      callBackError.apply(this, (args.unshift( err ), args ) ) ; 
    else 
      callBackSuccess.apply( this, (args.push( data ), args )  ) ;
  } 
}

//print listening port
function successListen() {
  console.log('listening on *:' + config.port); 
}