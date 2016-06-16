var config      = require( './config' )  //Load config, such as port and db information
  , express     = require( 'express' )
  , app         = express()
  , http        = require( 'http' ).Server( app )  
  , bodyParser  = require( 'body-parser' )
  , multer      = require( 'multer' ) 
  , upload      = multer()					
  , mysql       = require( "mysql" ) 
  , dialojDb    = mysql.createPool( config.database )
  , morgan      = require('morgan') //debug tool
  , readCsv     = require('./readCsv') ; 


app.use( morgan( 'dev' ) );
app.use( bodyParser.json() );                         // for parsing application/json
app.use( bodyParser.urlencoded({ extended: true }) ); // for parsing application/x-www-form-urlencoded
app.use( express.static( 'dist' ) );                  // serve static files from the distribution folder
app.use( '/scripts/lib/', express.static( 'bower_components' ) ); //Serve static javacript libs

app.set('view engine', 'pug');

http.listen( config.port, successListen );

app.get( '/', renderLoginPage ) ; 
app.post('/register', upload.array(), register ) ;


app.get( '/form', renderFormPage ) ; 
app.get( '/install/:filename', getInstallDialogie  ) 



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
    , entreprise : requete.body.prenom || ""
    , email :  requete.body.email || ""
  }   
  updateOrCreateUser( requete, reponse ) ; 
} 


//Update or create User
function updateOrCreateUser( requete, reponse ){
  mesartimBd_pooled_query(requete, 'SELECT * FROM user WHERE email = ?',  requete.user.email 
       , wrapProcess( processUpdateOrCreateUser, printAndSkip, requete, reponse ) ) ; 
}

function processUpdateOrCreateUser( requete, reponse, rows ) {
  if( rows.length > 0 ) {
    requete.user.id = rows[0].id ;     
  } else {
    createUser( requete, reponse ) ;
  }
}

function createUser( requete, reponse ) {
  mesartimBd_pooled_query(requete, 'INSERT INTO user SET ?', requete.user
         , wrapProcess( processNewUser, printAndSkip, requete, reponse )
  ) 
}

function processNewUser( requete, reponse, err, result ){
  if(err) throw err;
  requete.user.id = result.insertId
  requete.participation = {
      user_id :  result.insertId
    , seance_id : requete.body.seanceId || 1
  } 
  createParticipation( requete, reponse ) ; 
}
function createParticipation( requete, reponse ) {
  mesartimBd_pooled_query(requete, 'INSERT INTO participation SET ? ON DUPLICATE KEY UPDATE lastlogin=NOW();', requete.participation
       , wrapProcess( processNewParticapation, printAndSkip, requete, reponse )   
  )
}

function processNewParticapation( requete, reponse, result ){
  if( requete.sqlConnection ) requete.sqlConnection.release()
  requete.participation.id = result.insertId
  //Should rather send a token 
  token=jwt.sign( { user : requete.user, participation : requete.participation }
                , app.get('secret')
                , { expiresIn: "24h" // expires in 24 hours    
                } ) ;
  reponse.cookie( 'token', token );
  reponse.redirect('/generation')

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
                            } ) ;
  connection.release()
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


//print listening port
function successListen() {
  console.log('listening on *:' + config.port); 
}