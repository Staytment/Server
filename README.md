Installation
============

Tested with Ubuntu 14.04.

Install NodeJS, Node Package Manager and MongoDB:

    sudo apt-get install nodejs npm mongodb

On Ubuntu, please create this symlink for node. It is required for some nodejs programs, e.g. mocha.

    ln -s /usr/bin/nodejs /usr/bin/node

Download the repository:

    git clone git@github.com:Staytment/Server.git
    cd frozen-forest
  
You might want to check out a tagged version. Please note that versions that are not tagged might fail our unittests.

    git checkout vX.X.X

Install NodeJS dependencies:

    npm install
  
To be able to run the tests, install the following tools globaly:

    sudo npm install -g mocha istanbul jshint
    
And then run the tests:

    npm test
  
To run the server and play with it, execute:

    node ./frozen-forest.js
    
Updating
========

Please note that checking out a new version via git might require updating the used node modules:

    npm update
