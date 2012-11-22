define(['pundit/AuthenticatedRequester'], function(AuthenticatedRequester) {

    suite("Authenticated Requester TESTS", function() {
        
        setup(function() {
            ar = new AuthenticatedRequester();
        });

        test('.HTTP_ERROR_FORBIDDEN should be a number', function() {
            expect(ar.HTTP_ERROR_FORBIDDEN).to.be.a("number");
        });

        test('.HTTP_ERROR_FORBIDDEN should be 403', function() {
            expect(ar.HTTP_ERROR_FORBIDDEN).equal(403);
        });

        test('callback onLogin()', function() {
            expect(ar.onLogin).to.be.a("function");
        });
        
        test('callback onLogout()', function() {
            expect(ar.onLogout).to.be.a("function");
        });
        
        test('testing handle login load empty json', function() {
            var json = {};
            ar._handleLoginLoad(json, function(b, data) {
                expect(b).equal(false);
            })
        });

        test('testing handle login load .loginStatus: 1', function() {
            var json = {loginStatus: 1};
            ar._handleLoginLoad(json, function(b, data) {
                expect(b).equal(true);
            })
        });

        test('testing handle login load .loginStatus: 0', function() {
            var json = {loginStatus: 0};
            ar._handleLoginLoad(json, function(b, data) {
                expect(b).equal(false);
            })
        });
        
        test('BlockedRequests must be empty', function() {
            expect(ar.blockedRequests.length).equal(0);
        });
        
        test('_setWrappingCallParams + redirect-to json must put an item in blockedRequests ', function() {
            var redirectTo = 'gigi',
                o = {
                    load: function() {},
                    error: function() {}
                },
                o2 = ar._setWrappingCallParams(o);
                o2.load({redirectTo: redirectTo});
                
                expect(ar.blockedRequests.length).equal(1);
                expect(ar.redirectURL).equal(redirectTo);
        });
        
        test('create callback', function() {
            var cbName = 'MyCallbackName';
            expect(ar['on' + cbName]).to.be.a("undefined");
            var arrayName = "on"+cbName+"Callbacks";        
            ar.createCallback(cbName);
            expect(ar['on' + cbName]).to.be.a("function");
            expect(ar[arrayName]).to.be.a("object");
            expect(ar[arrayName].length).equal(0);
            
            var fireOn = "fireOn"+cbName;
            expect(ar[fireOn]).to.be.a("function")
            
            ar["on"+cbName](function(){ });
            expect(ar[arrayName].length).equal(1);
        });

    });

});