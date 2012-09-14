require('../dojoConfig.js');

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


    socket.on('get bookmarks', function() {
        socket.get('nickname', function (err, name) {
            console.log(name+" get bookmarks");
            
            var foo = {
                bookmarks: [
                    {a: 'xyz', b: 'ksjjz'},
                    {abc: '...', def: '___'}
                ],
                num: 2
            }
            socket.emit('res bookmarks', foo);
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