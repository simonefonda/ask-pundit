require('../dojoConfig.js');

var nStore = require('nstore'), collections;
nStore = nStore.extend(require('nstore/query')());
    
collections = nStore.new('data/collections.db', function () {
    console.log('DB ready.');
});

console.log('Launching socket.io server on port '+dojoConfig.ask.nodeServerPort);

var io = require('socket.io').listen(parseInt(dojoConfig.ask.nodeServerPort, 10)),
    ppl = {},
    sks = {};

io.sockets.on('connection', function (socket) {

    function refresh() {
        console.log('refresh!');
        socket.emit('refresh', {ppl: ppl});
        socket.broadcast.emit('refresh', {ppl: ppl});
    }

    socket.on('set nickname', function (name) {
        socket.set('nickname', name, function () {
            if (name in ppl) {
                console.log('Name taken .. ', name);
                socket.emit('change nickname', name);
            } else {
                ppl[name] = true;
                sks[name] = socket;
                socket.emit('logged in', {you: name});
                refresh();
                console.log('new nickname', name);
            }
        });
    });

    socket.on('new collection', function(data) {
        collections.save(data.name, data, function (err) {
            if (err) { 
                throw err;
            } else {
                console.log("new collection", data);
                socket.emit('res new collection ok', data);
            }
        });
    });

    socket.on('collection exist', function(name) {
        collections.get(name, function(err, doc, key) {
            if (err) {
                console.log('err reading :(', err, doc, key);
                socket.emit('res collection exist ko', {err: err, doc: doc, key: key, name: name});
            } else {
                console.log('Collection exist!', err, doc, key);
                // TODO: Sending back the whole object.. password included? super!
                socket.emit('res collection exist ok', {err: err, doc: doc, key: key});
            }
        });
    });

    socket.on('subscribe collection', function(data) {
        collections.get(data.name, function(err, doc, key) {
            if (err) {
                console.log('err reading :(', err, doc, key);
                socket.emit('res subscribe collection ko', {err: err, doc: doc, key: key, name: data.name});
            } else {
                if (doc.password !== data.password) {
                    console.log('## WRONG PASS! help', err, doc, key);
                    socket.emit('res subscribe collection ko', {err: err, doc: doc, key: key, name: data.name});
                } else {
                    console.log('Password match yay!', err, doc, key);
                    socket.emit('res subscribe collection ok', {err: err, doc: doc, key: key});
                }
            }
        });
    });


    socket.on('get bookmarks', function() {
        collections.all(function(err, result) {
            console.log('All collections ', err, result);
            socket.emit('res bookmarks', result);
        });
    });
    
    socket.on('disconnect', function () {
        socket.get('nickname', function (err, name) {
            console.log('dced: ', name);
            delete sks[name];
            delete ppl[name];
            refresh();
        });
    });

    // c for chat
    socket.on('c party', function (msg) {
        socket.get('nickname', function (err, name) {
            console.log(name+" chat party message "+msg);
            socket.broadcast.emit('c party', name, msg);
        });
    });
  
});