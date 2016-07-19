requirejs.config({
  paths: {
    requirejs: 'require',
    jquery: 'lib/jquery/dist/jquery',
    jqueryui: 'lib/jquery-ui',
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
    }
  }
});

// Start the main app logic.
requirejs(['jquery', 'materialize', 'jqueryui/ui/sortable'],
  function () {
    $('#dialogie').submit( traitementFormulaire );    
    $("select").material_select()   
    $("#completeProfile").submit( completeProfile ) ;



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
                          , value : 1  } )
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
      console.log( data )
      $.post( "/completeProfile", data, function() {} ) 


    }


  }
)