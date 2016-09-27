module.exports = function(grunt) {
  grunt.initConfig(
  { pkg: grunt.file.readJSON('package.json')
  , sass: {
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
    , watch: {
      css : {
        files: ['sass/**']
      , tasks: ['copy:dialoJSass', 'sass']
      }
    , js : {
      files:  ['dev-scripts/**']
      , tasks: ['copy:dialoJScripts']
      } 
    }  
  });
  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
  });
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');  
  grunt.registerTask('default', ['copy', 'sass']);

};