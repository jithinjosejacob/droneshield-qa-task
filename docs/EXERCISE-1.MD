# TEST-STRATEGY 

Refer - Test Strategy Document -DroneShield.docx in docs

# TEST PLAN

Refer - TEST PLAN - DroneShield.docx in docs

# Assumption 

Hint has been given that development team uses Python.

As it is a backend language, assuming that there is another service written for UI Layer(TypeScript/JavaScript) sitting in another codebase.

# DECISIONS AND REASONS 

If I write tests in same repo as source code where it uses Python, Python is preferred for testing. as it would be easy to maintain codebase

I assume that developers are writing unit and integration tests using mocks for the services they are developing and has enough coverage.

In this sceanrio , i assume that we are doing blackbox testing , and donthave source code base with us

Also assume that frontend could be written in TypeScript/JavaScript.

It could be easily for frontend devs also to contribute if we use TypeScript for UI and API Testing

Due to features like opensource, autowait and plenty of debugging features,playwright is choosen as a preferred web automation library.

Used a simple Page Object Model as the design pattern, as suggested by Playwright team for easy design and maintenance and used fixtures for object creation for making code base clean.

We could resuse auth by saving local storage and using that across the tests, as it would save time in logging in every time.

Test Implementation is located in pageFactory, where i have used a simple BasePage and other pages extend from BasePage, where we need to place reusable methods in BasePage.
This makes the code simple and resuable and easily extended to multiple pages.

# Tests 

Tests are located in tests/uitests directory

TC101_addToCart.spec - > Validating add to cart test