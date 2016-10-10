define( [],
	function() {

		var recommandation = new ( function RecommandationSystem() {} ) () 
		window.recommandation = recommandation ; 



		function init( myself, users, votes ) {
			console.log( users ) ;
			this.myself = myself ; 			
			this.users = prepareUsers( users, votes )
			this.votes = votes ;
			this.myself = this.users[ myself.id ]				
			this.updateFiltre() ; 
		}
		function updateFiltre( ) {
			this.myself.filters={} ;
			var filters =  $("#users").serializeArray() ; 
			for( var i = 0 ; i < filters.length ; i++  ) {
				var filter = filters[ i ]
				this.myself.filters[ filter.name.split("_")[1]*1 ] = filter.value*1 ; 
			} 
		}
		function computeRecommandation() {
			this.updateFiltre() 
			var matrice = {} 
			for( var i in this.users ) {
				matrice[ i ] = compare( this.myself.votes, this.users[i].votes, this.myself.filters )
			}
			this.recommandation = matrice ; 
			return matrice ;
		}


		function compare( user1Vote, user2Vote, preference ) {			
			var categorie = { total:0} 
				, total = 0 
				, compteurCategorie = 0 
			//pour chaque catégorie
			for( var i in user1Vote ) {
				compteurCategorie ++ 
				categorie[i] = 0
				var counteur  = 0 
				//pour chaque dialogie dans la catégorie
				for( var j in user1Vote[i] ) {
					counteur++ ;
					//prendre en compte le weight weight[ user1Vote[i][j].dialogie_id ] * 
					
					if( preference[ user1Vote[i][j].dialogie_id ] ==  0 ){
						val = ( user1Vote[i][j].value - user2Vote[i][j].value ) 
					}else {
						
						if( Math.sign( user2Vote[i][j].value ) == preference[ user1Vote[i][j].dialogie_id ] ) val= 0 
						else val=6 
					}
					categorie[i] +=  val*val ; 
				}
				//moyenne 
				categorie[i] = Math.floor(  Math.sqrt( categorie[i]  )/ counteur / 2 * 100  );
				total += categorie[i]
			}
			categorie["total"] = Math.floor(total / compteurCategorie ) ; 
			return categorie ;
		}


		var symbols = ["<i class='material-icons'>star</i><i class='material-icons grey-text text-lighten-2'>star</i><i class='material-icons grey-text text-lighten-2'>star</i>", "<i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons grey-text text-lighten-2'>star</i>", "<i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i>", "<i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i>", "<i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i>",  "<i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i>" ]

		function mapValeurToSymbol( valeur ) {
			valeur = Math.floor( (100-valeur) / 33 ) ; 
			return symbols[ valeur ] ;
		} 


		function createRow( name , lineMatrice ) {
			var line = document.createElement( "tr" )
				, $line = $(line)
				, cell = document.createElement( "th" )
				, $cell = $(cell)

			$cell.text( name ) ; 				
			$line.append( cell )
			for( var i in lineMatrice ) {
				cell = document.createElement( "td" )
				$cell = $(cell)
				$cell.append( mapValeurToSymbol(lineMatrice[i])      ) ; 				
				$line.append( cell )			
			} 
			return $line ;
		}

		function createHeader( lineMatrice ) {
			var line = document.createElement( "tr" )
				, $line = $(line)
				, cell = document.createElement( "th" )
				, $cell = $(cell)

			$cell.text( "Participants" ) ; 				
			$line.append( cell )
			for( var i in lineMatrice ) {
				cell = document.createElement( "td" )
				$cell = $(cell)
				$cell.text( i ) ; 				
				$line.append( cell )			
			} 
			return $line ;
		}


		function swapArray( A, x, y ) {
				A[x] = A.splice(y, 1, A[x])[0];
			}

		//bubble sort ... not the fastest but easy to implement 
		function ge6Best( array, attribute, criteria ) {
			var localArray = array.slice(0) ; 
			//WE only need the 5 best 
			for( var i = 0 ; i <  6  ; i++ ) {
				for( var j = 0 ; j < localArray.length - i - 1; j++ ) {
					if( localArray[j][ attribute ][ criteria ] < localArray[j+1][ attribute ][ criteria ] ) swapArray( localArray, j, j+1 ) ;				
				}
			}
			return localArray.slice(-6) ;
		}




		function afficheRecommandation( ) {
			
			this.computeRecommandation() 
			var table = document.createElement( "table")
				, header = document.createElement( "thead")
				, body = document.createElement( "tbody")
				,	$table = $( table )
				,	$header = $( header )
				,	$body = $( body )
						 
			
			$table.append( $header )
			$table.append( $body )

			var array = [] 
			for( var i in this.recommandation ) {
				array.push( { nom : this.users[i].name, recommandation : this.recommandation[i] } )
			}

			array = ge6Best( array, "recommandation", "total" ) ;
			
			for( var i = array.length - 2 ; i >= 0 ; i--  ) {
				$body.append( createRow( array[i].nom, array[i].recommandation ))
			}
			$header.append( createHeader(  array[0].recommandation ))
			$("#tableWrapper").empty( ) ;;
			$("#tableWrapper").append( $table ) ;;
			return $table 
		}

		function prepareUsers( users, votes ) {
      //hashtable to store user by id
      var hashUser = {}

      //Create each user in the hash table
      for( var i = 0 ; i < users.length ; i++ ) {
      	user = users[i] ;
      	hashUser[ user.id*1 ] = {
      		nom : user.nom 
      		, name : ( (user.sex=="male")?"M. ":"Mme ")  +  user.prenom + " " + user.nom 
      		, votes : {}
      		, id : user.id 
      	}
      	user.name = ( (user.sex=="male")?"M. ":"Mme ")  +  user.prenom + " " + user.nom 
      }

      //add all vote to its user by dialogie.id
      for( var i = 0 ; i < votes.length ;i++) {
      	var vote = votes[i]
      	  , categorie = votes[i].description
      	  if(  !hashUser[ vote.user_id ].votes.hasOwnProperty( categorie ) ) {
      	  	hashUser[ vote.user_id ].votes[categorie] = {} 
      	  }      	
        hashUser[ vote.user_id ].votes[categorie][ vote.southPole ] = { dialogie_id : vote.dialogie_id, value : vote.value - 4 } 

      }     
      return hashUser
    }
    recommandation.init = init ; 
    recommandation.updateFiltre = updateFiltre ;
    recommandation.computeRecommandation = computeRecommandation ;
    recommandation.afficheRecommandation = afficheRecommandation ;
  })