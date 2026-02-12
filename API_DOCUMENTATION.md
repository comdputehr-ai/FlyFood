# FlyFood API Documentation

## Overview
This document contains REST API documentation for the FlyFood application, which provides endpoints for managing restaurants, menus, orders, cities, maps, searches, and user management.

## Endpoints

### Restaurants

- **GET /restaurants**  
  Retrieve a list of restaurants.
  - **Response Example:**
    ```json
    [
      {
        "id": "1",
        "name": "Pizza Place",
        "location": "New York",
        "ratings": "4.5"
      },
      {
        "id": "2",
        "name": "Sushi Spot",
        "location": "San Francisco",
        "ratings": "4.7"
      }
    ]
    ```

### Menus

- **GET /restaurants/{restaurantId}/menus**  
  Retrieve menus for a specific restaurant.
  - **Response Example:**
    ```json
    [
      {
        "id": "101",
        "name": "Sushi Platter",
        "price": "29.99"
      },
      {
        "id": "102",
        "name": "California Roll",
        "price": "12.99"
      }
    ]
    ```  

### Orders

- **POST /orders**  
  Create a new order.
  - **Request Example:**
    ```json
    {
      "userId": "abc123",
      "restaurantId": "1",
      "items": [
        {
          "menuItemId": "101",
          "quantity": "2"
        }
      ]
    }
    ```
  - **Response Example:**
    ```json
    {
      "orderId": "order_001",
      "status": "confirmed"
    }
    ```  

### Cities

- **GET /cities**  
  Retrieve a list of cities available in the application.
  - **Response Example:**
    ```json
    [
      "New York",
      "Los Angeles",
      "San Francisco"
    ]
    ```  

### Map

- **GET /map**  
  Get map details for a specific location (latitude, longitude).
  - **Response Example:**
    ```json
    {
      "latitude": "34.0522",
      "longitude": "-118.2437",
      "locationName": "Los Angeles"
    }
    ```  

### Search

- **GET /search**  
  Search for restaurants or menu items based on a query string.
  - **Request Example:**
    ```json
    {
      "query": "sushi"
    }
    ```
  - **Response Example:**
    ```json
    [
      {
        "id": "2",
        "name": "Sushi Spot"
      }
    ]
    ```  

### User Management

- **POST /users**  
  Create a new user account.
  - **Request Example:**
    ```json
    {
      "username": "john_doe",
      "password": "securepassword",
      "email": "john@example.com"
    }
    ```
  - **Response Example:**
    ```json
    {
      "userId": "user_001",
      "message": "Account created successfully."
    }
    ```

## Conclusion
This documentation provides an overview of the API endpoints for the FlyFood application. Please refer to this document for details on how to interact with the REST API operations.  
