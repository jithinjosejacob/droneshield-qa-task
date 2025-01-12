# Assumption 

Hint has been given that development team uses Python.

As it is a backend language, assuming that there is another service written for UI Layer(TypeScript/JavaScript) sitting in another codebase.

# Decision Making

If I write tests in same repo as Python, Python is preferred for testing.

In this sceanrio , i assume that we are doing blackbox testing

# API Testing Framework design

Since we have used Playwright for UI Testing, and would prefer same repo for keeping API Tests also there , so used Playwright for API Testing
We sticked to same programming language and testing library
This would be easily for functional testers to pickup and would result in easy maintenance

# Tests 

Tests are located in tests/apitests directory

TC201_statusCode.spec.ts - > Validating simple status code

TC202_dataHandling.spec.ts -> If test data needs to be created globally, or auth is required for tests , good to use globalsetup
If test data needs to be created / cleaned, use before and after hooks in api tests
Since exercise is taking time, rough implementation has been provided.

Other Sceanrios - test cases for HTTP status codes, sending proper information, invalid information, incorrect format, and other possible edge cases.
We can use TC201 to handle these sceanrios as seperate test cases