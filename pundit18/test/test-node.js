dojoConfig = {
    async: true,
    parseOnLoad: true,
    isDebug: true, 

    packages: [
        { name: 'myTest', location: '/Users/fonda/Documents/semlib/ask-pundit/pundit18/test' },
        { name: 'testLib', location: '/ask-pundit/pundit18/test/lib' },
        { name: 'dojo', location: '/Users/fonda/Documents/semlib/ask-pundit/dojo/dojo' },
        { name: 'dijit', location: '/Users/fonda/Documents/semlib/ask-pundit/dojo/dijit' },
        { name: 'bootstrap', location: '/Users/fonda/Documents/semlib/ask-pundit/dojo-Bootstrap/src/bootstrap' }
    ]
};

if (process.env.COVERAGE) {
    dojoConfig.packages.push({ name: 'pundit', location: '/Users/fonda/Documents/semlib/ask-pundit/pundit18/cov' });
} else {
    dojoConfig.packages.push({ name: 'pundit', location: '/Users/fonda/Documents/semlib/ask-pundit/pundit18/src' });
}


/*
## TODO : test-cov.html deve caricare pundit col codice di coverage
## -- dojoConfig.packages ... pundit .. !
## TODO : configurare jscoverage ?
## TODO : .gitignore di tutta sta roba ?
*/

require('../../dojo/dojo/dojo');
expect = require('chai').expect;

jsdom = require('jsdom');
window = jsdom.jsdom().createWindow();
document = window.document;

_PUNDIT = {};

global.require([
    'myTest/TestBaseComponent',
    'myTest/TestAuthenticatedRequester'
], function() {
    // Do something? :)
});
