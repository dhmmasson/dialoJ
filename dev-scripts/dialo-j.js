requirejs.config({
  paths: {
    requirejs: 'require',
    jquery: 'lib/jquery/dist/jquery',
    jqueryui: 'lib/jquery-ui',
    'amcharts': 'lib/amcharts3/amcharts/amcharts',
    'amcharts.radar': 'lib/amcharts3/amcharts/radar',
    'amcharts.funnel': 'lib/amcharts3/amcharts/funnel',
    'amcharts.gauge': 'lib/amcharts3/amcharts/gauge',
    'amcharts.pie': 'lib/amcharts3/amcharts/pie',
    'amcharts.serial': 'lib/amcharts3/amcharts/serial',
    'amcharts.xy': 'lib/amcharts3/amcharts/xy',    
    'amcharts.chalk': 'lib/amcharts3/amcharts/themes/chalk',
    'amcharts.light': 'lib/amcharts3/amcharts/themes/light',
    'materialize': 'lib/Materialize/dist/js/materialize',
    'hammerjs':    'lib/Materialize/js/hammer.min',
    'jquery-hammerjs':'lib/Materialize/js/jquery.hammer'        
  },
  packages: [

  ],
  shim: {
    'materialize': {
      deps: ['jquery', 'hammerjs', 'jquery-hammerjs']
    },
    'jquery': {
      exports: '$'
    },
     "jqueryui": {
      //exports: "$",
      deps: ['jquery']
    },
    'amcharts.radar': {
      deps: [ 'amcharts' ],
      exports: 'AmCharts',
      init: function() {
        AmCharts.isReady = true;
      }
    },
    'amcharts.funnel'   : {
        deps: ['amcharts'],
        exports: 'AmCharts',
        init: function() {
            AmCharts.isReady = true;
        }
    },
    'amcharts.gauge'    : {
        deps: ['amcharts'],
        exports: 'AmCharts',
        init: function() {
            AmCharts.isReady = true;
        }
    },
    'amcharts.pie'      : {
        deps: ['amcharts'],
        exports: 'AmCharts',
        init: function() {
            AmCharts.isReady = true;
        }
    },
    'amcharts.serial'   : {
        deps: ['amcharts'],
        exports: 'AmCharts',
        init: function() {
            AmCharts.isReady = true;
        }
    },
    'amcharts.xy'       : {
        deps: ['amcharts'],
        exports: 'AmCharts',
        init: function() {
            AmCharts.isReady = true;
        }
    },
     'amcharts.chalk'       : {
        deps: ['amcharts'],
        exports: 'AmCharts',
        init: function() {
            AmCharts.isReady = true;
        }
    },
     'amcharts.light'       : {
        deps: ['amcharts'],
        exports: 'AmCharts',
        init: function() {
            AmCharts.isReady = true;
        }
    }

  }
});

// Start the main app logic.
requirejs(['amcharts.serial', 'amcharts.light', 'jquery', 'materialize', 'jqueryui/ui/sortable', "recommandation"],
  function (amref) {
    $('#dialogie').submit( traitementFormulaire );    
    $("select").material_select()   
    // $("#completeProfile").submit( completeProfile ) ;

    $(".next").click( goToNext ) ; 

    function goToNext( e ) {
      $this = $( this ) ; 
      e.preventDefault() 
      $( $this.data( "tab" )).click()
      $("body").scrollTop(0) ;
    }

    function traitementFormulaire( e ) {
      $this = $( this ) ; 
      e.preventDefault() 
      var formBrut = $this.serializeArray() 
        , metriques = []
        , values = []
      for( var i = 0 ; i < formBrut.length ; i++ ) {        
        var name = formBrut[i].name
          , value = formBrut[i].value
          , matchName = name.match(/dialogie_(\d*)_(.*)/) 
          , dialogie_id = matchName[1]
          , criteria    = matchName[2]
      
        if( criteria == "value") {
          values.push( { dialogie_id : dialogie_id, value :  value } )  ;           
        } else {
          metrique_id = criteria.match(/metrique_(\d*)/)[1]
          metriques.push( { dialogie_id : dialogie_id
                          , metrique_id : metrique_id
                          , value : value  } )
        }
      }
      
      $("#valuesToSend").val( JSON.stringify(values) ) ;
      $("#metriquesToSend").val( JSON.stringify(metriques) ) ;
      $("#hiddenForm").submit() ; 
      $('.collapsible').collapsible()

      // $.post("/validation", { values : values, metriques : metriques }, function( data ) { 
      //   if( data.success ) {

      //   }

      //   console.log( data )} )
    
    }

    function completeProfile( e ) {
      $this = $( this ) ; 
      e.preventDefault() 
      var data = $this.serialize()
      
      $.post( "/completeProfile", data, function() {} ) 


    }

    $(".categoryRange").change( updateCategory ) ; 
    $(".categoryRange").on("input", updateLabelDialogie )
    $(".dialogieRange").on("input", updateLabelDialogie )
    $(".dialogieRange").on("change", updateLabelDialogie )
    $(".dialogieRange").on("change", updateGraph )

    function updateGraph () {
      calculDistance( data[2], data[0] )      
    }

    function updateCategory( e ) {
      $this = $( this ) ; 
      e.preventDefault() 
      $(".dialogieRange").each( updateDialogie.bind( this, $this.data("category"), $this.val() )) 

      updateGraph() ;
    }

    function updateDialogie( category, value, index, dialogie ) {
      if( $(dialogie).data("category") == category )  {
        $(dialogie).val( value ) ;
        updateLabelDialogie.apply( $(dialogie) )
      }
    }
    labels=["absent", "Très différent", "différent", "ignore", "similaire", "très similaire", "présent"]
    function updateLabelDialogie( e ) {
      $this = $(this )      
      
      $( $this.data("label") ).text( labels[ $this.val()*1 + 3 ] ) ;
    }


    function prepareUsers( users, votes ) {
            //hashtable to store user by id
      var hashUser = {}

      //Create each user in the hash table
      for( var i = 0 ; i < users.length ; i++ ) {
        user = users[i] ;
        hashUser[ user.id*1 ] = {
          nom : user.nom 
        , votes : {}
        , id : user.id 
        }
      }

      //add all vote to its user by dialogie.id
      for( var i = 0 ; i < votes.length ;i++) {
        vote = votes[i]
        
        var w1 = $( "#dialogie_" + vote.dialogie_id ).val() 
        if( vote.user_id != 22 ) w1 = Math.abs( w1 ) ;
        //console.log( vote.southPole )
        hashUser[ vote.user_id ].votes[ vote.southPole ] = w1 * Math.min( 1/3,  Math.max( -1/3, ( vote.value - 4 ) / 3)) 
      }
     
      return hashUser
    }

    function distanceEuclidienne( user1, user2 ) {
      resultat = 0 
      for( var i in user1.votes ) {
        var d =  user1.votes[ i ] - user2.votes[ i ] 
        resultat +=  d*d 
      }
      return Math.sqrt(resultat ) /user1.votes.length * 100 
    }
    function moyenneDiff( user1, user2 ) {
      resultat = 0 
      for( var i in user1.votes ) {
        var d =  user1.votes[ i ] - user2.votes[ i ] 
        resultat += Math.sqrt( d*d )
      }
      return resultat / user1.votes.length
    }
    function cosineDist( user1, user2 ) {
      denominateur = 0 
      accu1 = 0 
      accu2 = 0 
      for( var i in user1.votes ) {
        var d =  user1.votes[ i ] * user2.votes[ i ] 
          , a1 = user1.votes[ i ] * user1.votes[ i ] 
          , a2 = user2.votes[ i ] * user2.votes[ i ] 

        denominateur += d
        accu1 += a1 
        accu2 += a2 
      }
      return Math.acos( denominateur / Math.sqrt( accu2 * accu1  ) ) / Math.PI  
    }


    var dataProvider  = {}
    var chart 

    function calculDistance( users, votes ) {

      var hashUsers = prepareUsers( users, votes )
      var distMatrice = {} ;
      for( var indexUser1 in hashUsers ) {
        distMatrice[ hashUsers[indexUser1].nom ] = {} 
      }


      window.distMatrice = distMatrice ;


      for( var indexUser1 in hashUsers ) {
        
        user1 = hashUsers[ indexUser1 ] ; 
        for( var indexUser2 in hashUsers ) {
          //Don'T do the job twice, don'T compare to yourself 
          if( indexUser2*1 < indexUser1*1 ) continue           
          user2 = hashUsers[ indexUser2 ] ; 
          var dist = {
              euclidienne : distanceEuclidienne( user1, user2 )
            , moyenne : moyenneDiff( user1, user2 )
            , cosine : cosineDist( user1, user2 )
           
          }
          
          distMatrice[ user1.nom ][  user2.nom  ] = dist ; 
          distMatrice[ user2.nom  ][  user1.nom  ] = dist ; 
        }
      }


        var graphs = []
      
      var dataProviderArray = [] 
      var i = 0 
      for( var indexUser1 in hashUsers ) {
        i++ 
        var user1 = hashUsers[ indexUser1 ] ;         
        var valueField = "value_" + user1.id 
        graphs.push( 
        {
            title : user1.nom + " " + Math.round(  distMatrice[ "Legardeur" ][ user1.nom ].cosine * 100 ) 
          , valueField : valueField
          , type: "column"
          , fillAlphas: 0.8
          , lineAlpha: 0.2
          , color : "red"
          , hidden : (i !=1 )
        })
        for( voteIndex in user1.votes ) {
          var voteValue = user1.votes[ voteIndex ] ;
          if( !dataProvider.hasOwnProperty( voteIndex) ) {
            dataProvider[ voteIndex ] = 
              { category:  voteIndex
              , forceShow:true  }

          }
          dataProvider[ voteIndex ][ valueField ] = voteValue * 3  ;
        }
      }
      
      for( var i in dataProvider) {
        dataProviderArray.push( dataProvider[i] )
        
      }
      
      if( chart != undefined ) {
        //check who is hidden 

        for( var i = 0 ; i < chart.graphs.length ; i++ ) {
          graphs[i].hidden = chart.graphs[i].hidden         
        }
        chart.dataProvider = dataProviderArray
        chart.graphs = graphs ;
        
        chart.validateData() ;

      } else {


        chart = AmCharts.makeChart("chartdiv",
        {
          "type": "serial"
        , "categoryField": "category"
        ,  "theme": "light"
        , "fontSize" : "9" 
        , forceShowField : "forceShow"
        , "graphs": graphs
        , "valueAxes": [
            {
              "axisTitleOffset": 20
            , "minimum": -3
            , "maximum": +3
            , "axisAlpha": 0.15
            , "dashLength": 3
            }
          ]
        ,  "dataProvider": dataProviderArray
        , "legend": {
            "useGraphSettings": true
          }
        , "columnSpacing": 1
        , columnWidth : 0.8 
        , rotate:false

        , "categoryAxis": {
            "gridPosition": "start"
            , "position": "left"
            , gridCount : 34
            , autoGridCount : false
          }
         ,  "guides": [
              {
                "position": "left",
                expand : true, 
                "fillAlpha": 0.10,
                "category": 2402,
                "toCategory": 2462
              }
              , {
                "position": "left",
                expand : true, 
                "fillAlpha": 0.10,
                "category": 2542,
                "toCategory": 2602
              }
              , {
                "position": "left",
                expand : true, 
                "fillAlpha": 0.10,
                "category": 2672,
                "toCategory": 2732
              }
            ]
        
        })
      }
      var categoryAxis = chart.categoryAxis;
      categoryAxis.gridCount = 34 ;
      categoryAxis.autoGridCount = false;
      return distMatrice ;
    }

    window.calculDistance = calculDistance ;

   $( function() {calculDistance( data[2], data[0] )})


  $( function() {
    recommandation.init(data[6], data[2], data[0] )
    recommandation.afficheRecommandation() ;
    $("#afficheRecommandation").click( recommandation.afficheRecommandation.bind( recommandation ) )  ;

  })

  $( function() {
    $(".slider_3positions").click( function( ) {
      $this = $(this)
      console.log( "coucou", $this.val(), $this.attr("class"))
      $this.removeClass("extreme")
      if( $this.val() != 0 ) $this.addClass("extreme") ;
      console.log( "coucou", $this.val(), $this.attr("class"))
    })



  })







  }
)