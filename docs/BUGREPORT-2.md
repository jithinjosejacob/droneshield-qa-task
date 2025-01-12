# Note : Single bug from the app has been filed due to time taken in exploring app.

# Summary - 
API Response for find by status gives returns datatype for name instead of value

# Environment - Development 

# Build Version - 0.1

# Severity - 3

# Priority - 2

# Source URL - petstore.swagger.io/v2

# Steps to reproduce:

Use Postnman/API Testing tool to view the reponse from http://petstore.swagger.io/v2/pet/findByStatus?status=available for get calls

Verify the value returned by name

# Screenshot/Video - If any 

# TestData

# Actual Result

DataType string is returned in API Response

# Expected Response

Value for name should be returned in the API Response
