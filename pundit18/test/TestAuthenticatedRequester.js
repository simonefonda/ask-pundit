define(['pundit/AuthenticatedRequester'], function(AuthenticatedRequester) {

    suite("Authenticated Requester", function() {
        
        setup(function() {
            ar = new AuthenticatedRequester();
        });

        test('.HTTP_ERROR_FORBIDDEN sanity checks', function() {
            expect(ar.HTTP_ERROR_FORBIDDEN).to.be.a("number");
            expect(ar.HTTP_ERROR_FORBIDDEN).equal(403);
        });

        test('.HTTP_CONNECTION_ERROR sanity checks', function() {
            expect(ar.HTTP_CONNECTION_ERROR).to.be.a("number");
            expect(ar.HTTP_CONNECTION_ERROR).equal(0);
        });

        test('Callback onLogin()', function() {
            expect(ar.onLogin).to.be.a("function");
        });
        
        test('Callback onLogout()', function() {
            expect(ar.onLogout).to.be.a("function");
        });
        
        test('_handleLoginLoad() with empty json', function() {
            var json = {};
            ar._handleLoginLoad(json, function(b, data) {
                expect(b).equal(false);
            });
        });

        test('_handleLoginLoad() with .loginStatus: 1', function() {
            var json = {loginStatus: 1};
            ar._handleLoginLoad(json, function(b, data) {
                expect(b).equal(true);
            })
        });

        test('_handleLoginLoad() with .loginStatus: 0', function() {
            var json = {loginStatus: 0};
            ar._handleLoginLoad(json, function(b, data) {
                expect(b).equal(false);
            })
        });
        
        test('BlockedRequests must be empty', function() {
            expect(ar.blockedRequests.length).equal(0);
        });
        
        test('_setWrappingCallParams + redirect-to json must put an item in blockedRequests ', function() {
            var redirectTo = 'test',
                fake = {
                    load: function() {},
                    error: function() {}
                },
                fake2 = ar._setWrappingCallParams(fake);
                fake2.load({redirectTo: redirectTo});
                
                expect(ar.blockedRequests.length).equal(1);
                expect(ar.redirectURL).equal(redirectTo);
        });

    });

});