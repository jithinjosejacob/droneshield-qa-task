# Summary - 
API Response for find by status gives returns datatype for name instead of value

# Environment - Development 

# Build Version - 0.1

# Source URL - petstore.swagger.io/v2

# Steps to reproduce:

Use Postnman/API Testing tool to view the reponse from http://petstore.swagger.io/v2/pet/findByStatus?status=available for get calls

Verify the value returned by name

# Screenshot - If any 

# Actual Result

DataType string is returned in API Response

# Expected Response

Value for name should be returned in the API Response
