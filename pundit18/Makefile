REPORTER = spec

all: clean docs test-cov test
	
test:
	@NODE_ENV=test \
	./node_modules/.bin/mocha \
	--reporter $(REPORTER) \
	-u tdd \
	./test/test-node.js \
	
test-cov: 
	@rm -rf cov/*
	jscoverage src cov
	@echo "[Pundit] generated jscoverage source files"
	@sed 's%/\*COV\*/%coverage=true;%g' test/index.html > cov/test-cov.html
	@COVERAGE=1 \
	$(MAKE) test REPORTER=html-cov > cov/tests-coverage.html_foo
	@sed 's%</style>%</style><link rel="stylesheet" type="text/css" href="pundit_coverage.css">%g' cov/tests-coverage.html_foo > cov/tests-coverage.html
	@cp bin/pundit_coverage.css cov
	@rm cov/tests-coverage.html_foo
	@echo "[Pundit] generated jscoverage static files"

docs:
	./bin/build_docs.sh

docs-lint: 
	./bin/build_docs.sh lint

clean:
	rm -rf cov docs
	rm -f cov/tests-coverage.html
	@echo "[Pundit] cleaned up everything"

hello:
	@cp bin/package.json .
	npm install
	patch -p1 -i bin/mocha170.patch
	@echo "[Pundit] installed nodejs dependencies"
	@rm package.json

.PHONY: test test-cov live-cov docs docs-lint clean hello