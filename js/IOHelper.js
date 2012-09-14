define(["dojo/_base/declare"
        ], 
    function(declare) {
	
	return declare("ask.IOHelper", [], {
        socket: '',
        serverAddress: '',
        constructor: function(opts) {
            var self = this;

            self.inherited(arguments);
            self.serverAddress = opts.serverAddress;
            
            self.socket = io.connect(self.serverAddress);
            s = self.socket;
            
            s.on('error', function(data) {
                console.log("Error connecting to socket server, try again later.");
            })

            s.on('connection', function(data) {
                console.log('Connected to the server, yay ', data);
            });
			
			s.emit('set nickname', 'user '+(Math.random()*500|0));
			
            s.on('refresh', function (data) {
                console.log('REFRESH', data);

            });
            
            s.on('change nickname', function (data) {
                console.log('Nickname taken?! ouch.. ', data);

            });
            
            s.on('logged in', function (data) {
                console.log('Logged in.. hello!', data);

            });
            
        },
     
	});

});