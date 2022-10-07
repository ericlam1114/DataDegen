//Set Up Moralis API Rate Limits Here

//Enables you to change Moralis API Admin settings in the Moralis API dashboard online; Rate limits etc.

Moralis.settings.setAPIRateLimit({
    anonymous:20000, authenticated:20000, windowMs:60000
  })