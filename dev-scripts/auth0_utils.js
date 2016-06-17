  var lock = new Auth0Lock('EdNxwib3UPPqgPjZZbcAcmRN6wglUNQr', 'app52265043.auth0.com');    
  lock.show({
      container: 'root'
    ,  socialBigButtons: true
    , primaryColor : '#ffa726'
    , gravatar : false 
    , dict: 'fr'
    , icon: '/img/dialoJ.png'
    , callbackURL: 'http://localhost:5001/callback'
    , responseType: 'code'
    , authParams: {
      scope: 'openid email'  // Learn about scopes: https://auth0.com/docs/scopes 
    }
  });