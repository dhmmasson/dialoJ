var config      = require( './config' )  //Load config, such as port and db information
  , express     = require( 'express' )
  , app         = express()
  , http        = require( 'http' ).Server( app )  
  , cookieParser = require('cookie-parser')
  , session     = require('express-session')
  , bodyParser  = require( 'body-parser' )
  , multer      = require( 'multer' ) 
  , upload      = multer()					
  , mysql       = require( "mysql" ) 
  , dialojDb    = mysql.createPool( config.database )
  , morgan      = require('morgan') //debug tool
  , jwt = require('jsonwebtoken')
  , readCsv     = require('./readCsv')
  , passport    = require('passport')
  , strategy    = require('./authentication/setup-passport')

  ; 



app.use( morgan( 'dev' ) );

app.set('secret', config.secret); 
app.use( cookieParser() )

app.use( session({ secret: config.secret, resave: false,  saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use( bodyParser.json() );                         // for parsing application/json
app.use( bodyParser.urlencoded({ extended: true }) ); // for parsing application/x-www-form-urlencoded
app.use( express.static( 'dist' ) );                  // serve static files from the distribution folder
app.use( '/scripts/lib/', express.static( 'bower_components' ) ); //Serve static javacript libs
  
app.set('view engine', 'pug');

http.listen( config.port, successListen );

app.get( '/', renderLoginPage ) ; 


app.get( '/callback',  passport.authenticate('auth0', { failureRedirect: '/' }), register ) ;

app.get( '/splash',  checkAuthentication, getStartUpPage ) ; 
app.get( '/intro'  , checkAuthentication, getIntro ) ; 
app.get( '/form'  ,  checkAuthentication, renderFormPage ) ; 
app.get( '/final'  , checkAuthentication, renderFinalPage ) ; 

//TODO : Reactivate when admin stuff is ok
app.get( '/install/:filename', getInstallDialogie  ) 

app.post( '/validation', checkAuthentication, upload.array(), processValidation )

app.get( '/remerciment', checkAuthentication, upload.array(), renderFinalPage ) ; 
app.get( '/resultat', affichageResultat ) ; 
app.get( '/feedback', checkAuthentication, affichageResultatForOneUser ) ; 
app.post( "/completeProfile", checkAuthentication, completeProfile ) ; 
//================================================================
//Login et register
//================================================================
function renderLoginPage( requete, reponse ) {
  reponse.render( "login" )
}

function register( requete, reponse ) {
  if (!requete.user) {
    throw new Error('user null');
  }
  console.log( requete.user )
  requete.dialoJ_user = {
    nom :    requete.user.name.familyName || requete.user.nickname 
  , prenom : requete.user.name.givenName
  , email  : requete.user.emails[0].value 
  , auth0_id : requete.user.id 
  , displayName :requete.user._json.displayName || requete.user.nickname 
  }
  //Check if user exist
  var sql = 'SELECT * FROM user WHERE  auth0_id = ?' ;
  sqlPooled( { sql : sql, values : requete.user.id }, processUpdateOrCreateUser, requete, reponse ) ; 
} 

function processUpdateOrCreateUser( connection, rows, requete, reponse ) {
  if( rows.length > 0 ) {
    requete.dialoJ_user.id = rows[0].id ;   
    connection.release() ;
    finishRegistration( requete, reponse ) ;  
  } else {
    sqlPooled( { sql : 'INSERT INTO user SET ?', values : requete.dialoJ_user }, processNewUser, requete, reponse ) ; 
  }
}

function processNewUser( connection, rows, requete, reponse ){
  connection.release() ;
  requete.dialoJ_user.id = rows.insertId
  finishRegistration( requete, reponse ) ; 
}

function finishRegistration( requete, reponse ){
  console.log( requete.dialoJ_user ) ;
  //sqlPooled( { sql : 'INSERT INTO user SET ?', values : requete.user }, processNewUser, requete, reponse ) ; 
  token=jwt.sign( { user : requete.dialoJ_user }
                , app.get('secret')
                , { expiresIn: "24h" // expires in 24 hours    
                } ) ;
  reponse.cookie( 'token', token );
  reponse.redirect('/splash')
}

//================================================================
//Authentication
//================================================================
function checkAuthentication(requete, reponse, next) {
  // check header or url parameters or post parameters for token
  var token = requete.body.token || requete.query.token || requete.headers['x-access-token'] || requete.cookies.token;
  requete.token = token ; 
  // decode token
  if( process.env.LOCAL == "true" ) {
    requete.decoded = { user : {
      nom :    "dm"
    , prenom : "dd"
    , email  : "1"
    , auth0_id : "1"
    , displayName :"dddm"
    , id : 142 
    }}
    next() ;
    return 
  }
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
  return reponse.redirect("/")
  return reponse.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
}

function authenticationInvalid( err, requete, reponse, next ) {
  return reponse.redirect("/")
  return reponse.status(403).json({ success: false, message: 'Failed to authenticate token.' + err.message });    
}

function authenticationValid(requete, reponse, next, decoded ) {
  requete.decoded = decoded;    
  next();
}


//================================================================
//Startup PAGE
//================================================================
function getStartUpPage( requete, reponse ) {
  var sql = "SELECT id, description"+ "\n"
          + "FROM   thematique" + "\n"     
          + "WHERE  id = ( SELECT MAX( id ) FROM thematique LIMIT 1 )" + ";\n"  
  sqlPooled( { sql : sql }, renderStartUpPage, requete, reponse ) ; 
}

function renderStartUpPage( connection, data ,requete, reponse ) {
  
  requete.decoded.thematique = data[0].description 
  reponse.render( "splash", requete.decoded ) ;
  connection.release()
}

function getIntro( requete, reponse ) {
  var sql = "SELECT id, description"+ "\n"
          + "FROM   thematique" + "\n"     
          + "WHERE  id = ( SELECT MAX( id ) FROM thematique LIMIT 1 )" + ";\n"  
  sqlPooled( { sql : sql }, renderIntro, requete, reponse ) ; 
}

function renderIntro( connection, data, requete, reponse ) {
  //console.log( requete.decoded )
  requete.decoded.thematique = data[0].description 
  reponse.render( "splash2", requete.decoded ) ;
  connection.release()
}


//================================================================
//Form PAGE
//================================================================

//Get the latest dialogies and render the form
function renderFormPage( requete, reponse ) {
  var sql = "SELECT dialogie.id, dialogie.description as description, southPole, northPole, categorie_id, categorie.description as categorie_description, position" + "\n"
          + "FROM   dialogie" + "\n"
          + "JOIN   categorie ON categorie_id = categorie.id "
          + "WHERE  version = ( SELECT MAX( version ) FROM dialogie LIMIT 1 )" + ";\n"
          + "SELECT id, description, type"+ "\n"
          + "FROM   metrique" + "\n"
          + "WHERE  version = ( SELECT MAX( version ) FROM metrique LIMIT 1 )" + ";\n"
          + "SELECT id, description"+ "\n"
          + "FROM   categorie" + ";\n"
          + "SELECT id, description"+ "\n"
          + "FROM   thematique" + "\n"     
          + "WHERE  id = ( SELECT MAX( id ) FROM thematique LIMIT 1 )" + ";\n"         
  sqlPooled( { sql : sql }, processrenderFormPage, requete, reponse ) ; 
}
//Render the page using the data from the db
function processrenderFormPage( connection, data, requete, reponse ) {  
    console.log( data[ 3 ])
  reponse.render( "index",  { thematique : data[3][0].description
                            , dialogies : data[0]
                            , metriques : data[1]  
                            , categories : data[2]  
                            , token     : requete.token 
                            } ) ;
  connection.release()
}

//================================================================
//Validation
//================================================================
function processValidation( requete, reponse ) {
  
  var votes    = JSON.parse( requete.body.values ) 
    , metriques = JSON.parse( requete.body.metriques )
    , user_id   = requete.decoded.user.id ; 
  //console.log( votes, metriques )
  for( var i = 0 ; i < votes.length ; i ++ ){
    value = votes[ i ]
    votes[ i ] = [ value.dialogie_id, user_id, value.value ] 
  }
  for( var i = 0 ; i < metriques.length ; i ++ ){
    value = metriques[ i ]
    metriques[ i ] = [ value.dialogie_id, value.metrique_id, user_id, value.value ] 
  }
  var sql = "INSERT INTO vote( dialogie_id, user_id, value ) VALUES ? ;\n"
  var values = [ votes ]
  if( metriques.length > 0 )  {
    sql += "INSERT INTO evaldialogie( dialogie_id, metrique_id, user_id, value ) VALUES ? \n" ;
    values.push( metriques )
  }  
  //console.log( sql, values )
  sqlPooled( {sql : sql, values : values }, processValidationCb, requete, reponse ) 
}
function processValidationCb( connection, data, requete, reponse ) {  
  connection.release() 
  //reponse.json( {success: true })
  reponse.redirect("/remerciment")
}


//================================================================
//Remerciement
//================================================================
function affichageResultat( requete, reponse ) {
  
  var sql = "SELECT dialogie.id as dialogie_id ,  dialogie.description as description, southPole, northPole, vote.user_id as user_id, vote.value,  GROUP_CONCAT(DISTINCT evaldialogie.metrique_id ORDER BY evaldialogie.metrique_id DESC SEPARATOR ',') as evalsID" + "\n"
          + "FROM vote "+ "\n"
          + "LEFT JOIN evaldialogie ON evaldialogie.dialogie_id = vote.dialogie_id AND evaldialogie.user_id = vote.user_id "   + "\n"   
          + "JOIN dialogie ON dialogie.id = vote.dialogie_id "+ "\n"
          + "WHERE  dialogie.version = ( SELECT MAX( version ) FROM dialogie LIMIT 1 )" + "\n"
          + "GROUP BY vote.id "+ "\n"
          + "ORDER BY user_id, dialogie_id "+ "\n"
          + "; " + "\n"
  var sql1 = "SELECT dialogie.id, evaldialogie.user_id, southPole, northPole, position, dialogie.description as dialogie, metrique.description as metrique, metrique_id, vote.value as voteValue, evaldialogie.value as value  " + "\n"
           + "FROM evaldialogie  " + "\n"
           + "JOIN metrique ON metrique.id = metrique_id  " + "\n"
           + "JOIN dialogie ON dialogie.id = evaldialogie.dialogie_id  " + "\n"
           + "JOIN vote ON vote.`dialogie_id` = dialogie.id and vote.user_id = evaldialogie.user_id  " + "\n"
           + "WHERE  dialogie.version = ( SELECT MAX( version ) FROM dialogie LIMIT 1 )  " + "\n"
           + "ORDER BY evaldialogie.user_id, dialogie.id "    
             + "; " + "\n"      
  var sql2 = "SELECT user.* " + "\n"
          + "FROM vote "+ "\n"
          + "JOIN user ON user.id = user_id "+ "\n"
          + "JOIN dialogie ON dialogie.id = dialogie_id "+ "\n"
          + "WHERE  dialogie.version = ( SELECT MAX( version ) FROM dialogie LIMIT 1 )" + "\n"
          + "GROUP BY user_id "+ "\n"
          + "; " + "\n"
  var sql3 = "SELECT * FROM metrique WHERE  version = ( SELECT MAX( version ) FROM metrique LIMIT 1 ) ;"
  var sql4 = "SELECT id, description FROM categorie ;"
  var sql5 = "SELECT id, dialogie.description as description, southPole, northPole, categorie_id, position" + "\n"
          + "FROM   dialogie" + "\n"        
          + "WHERE  version = ( SELECT MAX( version ) FROM dialogie LIMIT 1 )" + ";\n"
  sqlPooled( {sql : sql + sql1 +sql2 + sql3 + sql4 + sql5  }, renderAfficheResultat, requete, reponse ) 

}

function affichageResultatForOneUser( requete, reponse ) {
    
  var userId = requete.decoded.user.id  ; 
console.log( userId)
  var sql = "SELECT dialogie.id as dialogie_id, southPole, dialogie.categorie_id, categorie.description, vote.user_id as user_id, vote.value" + "\n"
          + "FROM vote "+ "\n"
          + "LEFT JOIN evaldialogie ON evaldialogie.dialogie_id = vote.dialogie_id AND evaldialogie.user_id = vote.user_id "   + "\n"   
          + "JOIN dialogie ON dialogie.id = vote.dialogie_id "+ "\n"
          + "JOIN categorie ON categorie.id = dialogie.categorie_id "+ "\n"
          + "WHERE  dialogie.version = ( SELECT MAX( version ) FROM dialogie LIMIT 1 ) "+ "\n"
          + "GROUP BY vote.id "+ "\n"
          + "ORDER BY user_id, dialogie_id "+ "\n"
          + "; " + "\n"
  var sql1 = "SELECT dialogie.id, evaldialogie.user_id, southPole, northPole, position, dialogie.description as dialogie, metrique.description as metrique, metrique_id, vote.value as voteValue, evaldialogie.value as value  " + "\n"
           + "FROM evaldialogie  " + "\n"
           + "JOIN metrique ON metrique.id = metrique_id  " + "\n"
           + "JOIN dialogie ON dialogie.id = evaldialogie.dialogie_id  " + "\n"
           + "JOIN vote ON vote.`dialogie_id` = dialogie.id and vote.user_id = evaldialogie.user_id  " + "\n"
           + "WHERE  dialogie.version = ( SELECT MAX( version ) FROM dialogie LIMIT 1 ) AND vote.user_id =" +userId + "\n"
           + "ORDER BY evaldialogie.user_id, dialogie.id "    
             + "; " + "\n"      
  var sql2 = "SELECT user.* " + "\n"
          + "FROM vote "+ "\n"
          + "JOIN user ON user.id = user_id "+ "\n"
          + "JOIN dialogie ON dialogie.id = dialogie_id "+ "\n"
          + "WHERE  dialogie.version = ( SELECT MAX( version ) FROM dialogie LIMIT 1 )" + "\n"
          + "GROUP BY user_id "+ "\n"
          + "; " + "\n"
  var sql3 = "SELECT * FROM metrique WHERE  version = ( SELECT MAX( version ) FROM metrique LIMIT 1 ) ;"
  var sql4 = "SELECT id, description FROM categorie ;"
  var sql5 = "SELECT id, dialogie.description as description, southPole, northPole, categorie_id, position" + "\n"
          + "FROM   dialogie" + "\n"        
          + "WHERE  version = ( SELECT MAX( version ) FROM dialogie LIMIT 1 )" + ";\n"
  sqlPooled( {sql : sql + sql1 +sql2 + sql3 + sql4 + sql5  }, renderAfficheResultat, requete, reponse ) 

}

function renderAfficheResultat( connection, data, requete, reponse ) {
  connection.release() ; 
  data.push(requete.decoded.user)
  reponse.render( "resultat", {json : JSON.stringify (data ), votes : data[0], users : data[2], evals : data[1], metriques : data[3], categories : data[4], dialogies : data[5] , user : requete.decoded.user })

}

//================================================================
//Remerciement
//================================================================
function renderFinalPage( requete, reponse ) {
  console.log( requete.user )
  reponse.render( "final", { dialoJUser : requete.decoded.user, socialNetworkUserJSON : JSON.stringify(requete.user), socialNetworkUser : requete.user  } ) ;
}

//================================================================
//Remerciement
//================================================================
function completeProfile( requete, reponse ) {
  console.log( requete.body )
  var sql = "UPDATE user SET ? WHERE id = " + requete.decoded.user.id ;  
  sqlPooled(  {sql : sql, values : requete.body }, processCompleteProfile, requete, reponse )
  
}
function processCompleteProfile( connection, data, requete, reponse ) {
  connection.release() 
  reponse.render( "final2" ) ;
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
  requete.version = data[0].version + 1  ; 
  connection.release() ; 
  readCsv.read(  "res/" + requete.params.filename , processReadDialogies, requete, reponse  )
}
function processReadDialogies( data, requete, reponse ) { 
  var sql = "INSERT INTO dialogie( position, categorie_id, description, southPole, northPole, version ) " + "\n"
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
    if( err ) return console.error( "wrapProcessQueryCallback: error in sql query", err ) ;
    args.unshift( data ) ;
    args.unshift( connection ) ;
    callback.apply( this, args ) ;
  }
}
dialojDb.on('connection', function (connection) {
  //console.log( "connection to database") ; 
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