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



  }
)