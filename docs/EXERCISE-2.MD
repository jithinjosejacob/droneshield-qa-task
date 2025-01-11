# Assumption 

Hint has been given that development team uses Python.

As it is a backend language, assuming that there is another service written for UI Layer(TypeScript/JavaScript) sitting in another codebase.

# Decision Making

If I write tests in same repo as Python, Python is preferred for testing.

In this sceanrio , i assume that we are doing blackbox testing

# API Testing

Since we have used Playwright for UI Testing, and would prefer one repo for keeping API Tests also there , so used Playwright so that CI/CD becomes more easy