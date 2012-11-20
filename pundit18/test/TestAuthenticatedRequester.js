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
      

    });

});