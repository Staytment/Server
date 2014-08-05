Installation
============

Tested with Ubuntu 14.04.

Install NodeJS, Node Package Manager and MongoDB:

    sudo apt-get install nodejs npm mongodb

On Ubuntu, please create this symlink for node. It is possible for some nodejs programs, e.g. mocha.

    ln -s /usr/bin/nodejs /usr/bin/node

Download the repository:

    git clone git@bitbucket.org:trottldevelopement/frozen-forest.git
    cd frozen-forest
  
You might want to check out a tagged version. Please note that versions that are not tagged might fail our unittests.

    git checkout vX.X.X

Install NodeJS dependencies:

    npm install
  
Run it:

    node ./frozen-forest.js
  
In a second window, you might want to run the unittests to see if everything is working as expected. Install mocha with
npm first, but globally with the `-g` option, then, run it:

    sudo npm install -g mocha
    mocha -R spec
  
Updating
========

Please note that checking out a new version via git might require updating the used node modules:

    npm update