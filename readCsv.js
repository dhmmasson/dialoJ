var fs = require( 'fs' ) 
  , parse = require( 'csv-parse' ) 
module.exports = 
{	read : function( filename, callback, ...args ) {
		var parser = parse( { delimiter: ';' }
  								, ( err, data ) => {
  									if( err ) return console.log( "Error while parsing csv", err )
  									args.unshift( data )  								
  									callback.apply( this, args)
  								} );
		fs.createReadStream( filename, {encoding :"utf8"}).pipe(parser);
	}
};