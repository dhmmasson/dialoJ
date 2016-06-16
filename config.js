module.exports = 
{	database: {	host: process.env.SQL_HOST 		 
						,	user: process.env.SQL_USER 		 
						,	password: process.env.SQL_PASSWORD   
						,	database: process.env.SQL_DATABASE    
						, multipleStatements: true
						, connectionLimit : 10
						}
, port : process.env.PORT  || 6000
};