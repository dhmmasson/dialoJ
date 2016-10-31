define( [],
	function() {

		var recommandation = new ( function RecommandationSystem() {} ) () 
		window.recommandation = recommandation ; 



		function init( myself, users, votes, filters ) {
			console.log( users ) ;
			this.myself = myself ; 			
			this.users = prepareUsers( users, votes )
			this.votes = votes ;
			this.myself = this.users[ myself.id ]				
			this.updateFiltre( filters ) ; 

			console.log( "hello" ,  $("#modal1"))
			$(".filterDialogieBtn").hover( survolFilter, stopSurvolFilter )
														.click( selectFilter )
			$(".poleSelected").hover( survolSelected, stopSurvolSelected )
												.click( removeFilter )
			

		}
		function updateFiltre( filters ) {
			console.log( filters )
			if( filters.filters ) filters = filters.filters 	



			this.myself.filters={}
			for( var i = 0 ; i < filters.length ; i++ ) {
				if( this.myself.filters[ filters[i].name ] == undefined ) {
					this.myself.filters[ filters[i].name ] =  
						{ targetProfileId : filters[i].id
						,	targetProfileName : filters[i].name 
						, dialogies : {} 
						} 
				}
				var valeur = (  (( filters[i].absolute == 1 ) ? filters[i].value : this.myself.orientationByDialogieId[ filters[i].dialogie_id ]))			
				this.myself.filters[ filters[i].name ].dialogies[ filters[i].dialogie_id ] = {
					value : valeur
				, southPole : filters[i].southPole
				, northPole : filters[i].northPole
				} 
			}
 
 	
			$(".autoButton").remove() 
 			for( var i in this.myself.filters ) {
 				$button = $( document.createElement( "a" ))
 				$button.addClass( "modal-trigger waves-effect waves-light btn profilSelector autoButton")
 				$button.attr( "href", "#modal1" )
 				$button.data( "profile", this.myself.filters[i] )
 				$button.data( "title", i )
 				$button.text( i )
 				// $("#profilFilterDiv").prepend( $button )

 			}
			// $(".modal").modal({
 		// 			ready : prepareModal 
 		// 			, complete : createFilter.bind(this)
 		// 		})
		}
		function computeRecommandation() {
			// this.updateFiltre( filters ) 
			var matrice = {} 
			for( var i in this.users ) {
				matrice[ i ] = compare( this.myself.votes, this.users[i].votes, this.myself.filters.champions )
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
					
					
					//si le filtre n'est pas positionné
					if( preference.dialogies[ user1Vote[i][j].dialogie_id ] ==  undefined ){
					//	val = 0.5
					}else {
						counteur++ ;

						val = (  preference.dialogies[ user1Vote[i][j].dialogie_id ].value - user2Vote[i][j].value ) 		/6		
						categorie[i] +=  val*val ; 
					}
					
				}
				//moyenne 
				
				categorie[i] = Math.floor(  Math.sqrt( categorie[i]  / counteur )* 100  );
				if( counteur != 0 ) total += categorie[i]
			}
			categorie["total"] = Math.floor(total / compteurCategorie ) ; 
			return categorie ;
		}


		var symbols = ["<i class='material-icons'>star</i><i class='material-icons grey-text text-lighten-2'>star</i><i class='material-icons grey-text text-lighten-2'>star</i><i class='material-icons grey-text text-lighten-2'>star</i><i class='material-icons grey-text text-lighten-2'>star</i>",
 "<i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons grey-text text-lighten-2'>star</i><i class='material-icons grey-text text-lighten-2'>star</i><i class='material-icons grey-text text-lighten-2'>star</i>",
 "<i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons grey-text text-lighten-2'>star</i><i class='material-icons grey-text text-lighten-2'>star</i>",
 "<i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons grey-text text-lighten-2'>star</i>",
 "<i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i>",
  "<i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i><i class='material-icons'>star</i>" ]

		function mapValeurToSymbol( valeur ) {
			valeur = Math.round( Math.max( 0, (100 - valeur - 50 )) * 2 / 20)
			//valeur = Math.min(  Math.floor( (100-valeur) / 20 ) , 2 ) ; 
			return  symbols[ valeur ] ;
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
      		, orientationByDialogieId : {}
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
        hashUser[ vote.user_id ].orientationByDialogieId[ vote.dialogie_id ] = vote.value - 4  ;
      }     
      return hashUser
    }


    function prepareModal( modal, trigger  ) {
    	
    	

			$("#filterName").val( trigger.data("title") ) 
			$("#targetProfilId").val( $button.data( "profile").targetProfilId) 
			
 			var filters = $button.data( "profile")
 			console.log( filters )
 			$(".poleSelected").remove() ;
 			for( var i in filters.dialogies ) {


 				$temporaryFilter = 
    			$( document.createElement( "span" ) )
    				.addClass( "poleSelected" )
    				.data( "dialogieid", i  )    	
    		$("#panier").append( $temporaryFilter	)


    		$temporaryFilter  				
  				.append( 
  					$( document.createElement( "a" ) )
  						.addClass("btn waves-effect") )

  			
    		$temporaryFilter.addClass( filters.dialogies[i].value == 3 ? "northPole" : "southPole") ;    		
    		$temporaryFilter.children( "a" ).text( filters.dialogies[i].value == 3 ?  filters.dialogies[i]["northPole"] : filters.dialogies[i]["southPole"]  ) ;
    		$temporaryFilter.hover( survolSelected, stopSurvolSelected )
												.click( removeFilter )

 			}

    }

    function survolFilter () {
    	//Récupère l'élément survolé
    	$this = $(this)
    	//Récupère l'élément temporaire
    	$temporaryFilter = $("#panier .temporary") ; 


			//verifie que l'élément temporaire correspond à l'élément survolé, sinon stopSurvol et continue as if no temporary filter
			if( $temporaryFilter.length	== 1 && $temporaryFilter.data("dialogieid") != $this.data("dialogieid") ) {
				stopSurvolFilter.apply( this ) ; 
				$temporaryFilter = [] ;
			}

			//Si pas de temporary, verifie s'il existe un elemnt selectionné qui correspont au survol 
    	if( $temporaryFilter.length	== 0 ) {
    		$temporaryFilter = $( ".poleSelected" ).filter(function() { 
					return $(this).data( "dialogieid" ) == $this.data( "dialogieid" ) 
				});			
				$temporaryFilter.addClass( "temporary" )
				if( !$temporaryFilter.data( "previousPoleType" )  ) {
					$temporaryFilter.data( "previousPoleType" , $temporaryFilter.data("pole") )
					$temporaryFilter.data( "previousPoleText" , $temporaryFilter.text() )
				}
			}

			//Pas d'élément temporair ni d'éléemnt existant : Cree un nouvel elemetnt
    	if( $temporaryFilter.length	== 0 ) {

    		$temporaryFilter = 
    			$( document.createElement( "span" ) )
    				.addClass( "poleSelected temporary" )
    				.data( "dialogieid", $this.data("dialogieid") )    	
    			$("#panier").append( $temporaryFilter	)


    		$temporaryFilter  				
  				.append( 
  					$( document.createElement( "a" ) )
  						.addClass("btn waves-effect") )
    	}


    	$temporaryFilter.removeClass("northPole southPole")
    	$temporaryFilter.addClass( $this.data( "poletype" ) ) ;
    	$temporaryFilter.data("pole",  $this.data( "poletype" ))
    	$temporaryFilter.children( "a" ).text(  $this.text() ) ;

    }

    function stopSurvolFilter() {

    	$this = $(this)
    	$temporaryFilter = $("#panier .temporary") ; 
    	console.log( "stopSurvol", $temporaryFilter.data() )
    	//on survol un élement qui avait déjà été ajouté, restore old value
    	if( $temporaryFilter.data( "previousPoleType") ) {
    		$temporaryFilter.removeClass("northPole southPole temporary")
    		$temporaryFilter.addClass( $temporaryFilter.data( "previousPoleType" ) ) ;
    		$temporaryFilter.children( "a" ).text( $temporaryFilter.data( "previousPoleText" ) ) ;
    			$temporaryFilter.data("pole",  $temporaryFilter.data( "previousPoleType" ))
    		//$temporaryFilter.removeData( "previousPoleType" ) 

    	} else {
    		$temporaryFilter.remove() ;

    	}



    }

    function selectFilter() {
    	$temporaryFilter = $("#panier .temporary") ; 
    	$temporaryFilter.removeClass("temporary") ;
			$temporaryFilter.data( "previousPoleType" , $temporaryFilter.data("pole") )
			$temporaryFilter.data( "previousPoleText" , $temporaryFilter.text() )
			$temporaryFilter.hover( survolSelected, stopSurvolSelected )
											.click( removeFilter )
    }

    function removeFilter () {
    	$(this).remove() 

    }

		function survolSelected(argument) {
			$(this).addClass("temporary")
		}

		function stopSurvolSelected(argument) {
			$(this).removeClass("temporary")
		}

		function createFilter () {
			var targetProfile = { 
					  id : $("#targetProfilId").val() 
					,	name : $("#filterName").val() 
					, visibility : 0 
					, user_id : this.myself.id 
					}
				, filters = []
			 $(".poleSelected" ).each( function () {
			 	filters.push( 
			 		{ dialogie_id :  $(this).data( "dialogieid" )
			 		, targetProfile_id : $("#targetProfilId").val() 
			 		, absolute : 1 
			 		, value : ($(this).data( "pole" ) ==  "northPole" ) ? 1 : -1 
			 		, pole : $(this).data( "pole" )
			 	})
			 } )

console.log( targetProfile, filters  )
			 if( filters.length > 0 )
				 $.post( "/createFilter", { targetProfile : targetProfile, filters : filters }, updateFiltre.bind( this ) )
		}



    recommandation.init = init ; 
    recommandation.updateFiltre = updateFiltre ;
    recommandation.computeRecommandation = computeRecommandation ;
    recommandation.afficheRecommandation = afficheRecommandation ;
  })