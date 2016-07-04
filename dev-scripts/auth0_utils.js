  var lock = new Auth0Lock('EdNxwib3UPPqgPjZZbcAcmRN6wglUNQr', 'app52265043.auth0.com', {
      container: 'root'
    ,  socialBigButtons: true
    , primaryColor : '#ffa726'
    , gravatar : false 
    , dict: 'fr'
    , title : "coucou"
    , icon: '/img/dialoJ.png'
    , callbackURL: 'https://dialo-j.herokuapp.com/callback'
    , responseType: 'code'
    , theme : 
    	{ logo: "/img/dialoJ.png"
      , primaryColor: "#ffa726"    
    	}
    , authParams: {
      scope: 'openid email'  // Learn about scopes: https://auth0.com/docs/scopes
    }});    
  lock.show();