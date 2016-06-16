module.exports = function(grunt) {
  grunt.initConfig(
  { sass: {
      dist: {
        files: 
        { 'dist/css/dialo-j.css': '.grunt/sass/dialo-j.scss'      
        }
      }
    }
  , copy: 
    { materializeFont : 
      { files: [ { expand: true
                 , cwd: 'bower_components/Materialize/fonts/'
                 , src: ['**']
                 , dest: 'dist/fonts/'} ]
      }    
    , materializeSassFiles: 
      { files: [ { expand: true
                 , cwd: 'bower_components/Materialize/sass/'
                 , src: ['**']
                 , dest: '.grunt/sass/'} ]            
      }         
    , requirejs : 
      { files : [ { expand: true 
                  , cwd : "bower_components/requirejs" 
                  , src : ["require.js"]
                  , dest: "dist/scripts"
                  } ]
    }   
    , dialoJSass : 
      { files : [ { expand: true 
                  , cwd : "sass" 
                  , src : ["**"]
                  , dest: ".grunt/sass"
                  } ]
      }
    , dialoJScripts : 
      { files : [ { expand: true 
                  , cwd : "dev-scripts" 
                  , src : ["**"]
                  , dest: "dist/scripts"
                  } ]
      }
    }    
});
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask('default', ['copy', 'sass']);

};