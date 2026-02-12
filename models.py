class Restaurant:
    def __init__(self, name, location, cuisine_type):
        self.name = name
        self.location = location
        self.cuisine_type = cuisine_type

class MenuItem:
    def __init__(self, name, price, description):
        self.name = name
        self.price = price
        self.description = description

class Order:
    def __init__(self, restaurant, menu_items):
        self.restaurant = restaurant
        self.menu_items = menu_items

class User:
    def __init__(self, username, email):
        self.username = username
        self.email = email
