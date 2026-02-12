# FlyFood Usage Examples

## Restaurants

### Get a List of Restaurants
```python
restaurants = flyfood.get_restaurants()  # Fetches a list of all available restaurants
```

### Search for a Specific Restaurant
```python
restaurant = flyfood.get_restaurant_by_id(restaurant_id)  # Fetches details of a specific restaurant by ID
```

## Menus

### Get Menu for a Restaurant
```python
menu = flyfood.get_menu(restaurant_id)  # Fetches the menu for a specific restaurant
```

### Place an Order from the Menu
```python
order = flyfood.place_order(restaurant_id, menu_item_id, user_id)  # Places an order for a specific menu item
```

## Maps

### Get Directions to a Restaurant
```python
directions = flyfood.get_directions(restaurant_id, user_location)  # Fetches directions to the restaurant from the user's location
```

## Users

### Register a User
```python
user = flyfood.register_user(username, password)  # Registers a new user with provided credentials
```

### Get User Profile
```python
profile = flyfood.get_user_profile(user_id)  # Fetches profile details of the user
```

## Orders

### Get Order Status
```python
order_status = flyfood.get_order_status(order_id)  # Fetches the current status of the order by ID
```

### Cancel an Order
```python
flyfood.cancel_order(order_id)  # Cancels the order with the given ID
```
