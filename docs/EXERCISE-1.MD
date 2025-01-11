# TEST-STRATEGY 

Refer - Test Strategy Document -DroneShield

# TEST PLAN

Refer - TEST PLAN - DroneShield

# Assumption 

Hint has been given that development team uses Python.

As it is a backend language, assuming that there is another service written for UI Layer(TypeScript/JavaScript) sitting in another codebase.

# Decision Making

If I write tests in same repo as Python, Python is preferred for testing.

In this sceanrio , i assume that we are doing blackbox testing

Also frontend could be written in TypeScript/JavaScript.

It could be easily for frontend devs also contribute if we use TypeScript

Due to features like opensource, autowait and plenty of debugging features,playwright is choosen as a preferred web automation library.

Used a simple Page Object Model, as suggested by Playwright team for easy design and maintenance and used fixtures for object creation