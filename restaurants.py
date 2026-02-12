# Restaurant and Menu Management Code

class Restaurant:
    def __init__(self, name, cuisine_type):
        self.name = name
        self.cuisine_type = cuisine_type
        self.menu = {}

    def add_item(self, item_name, price):
        self.menu[item_name] = price

    def remove_item(self, item_name):
        if item_name in self.menu:
            del self.menu[item_name]

    def display_menu(self):
        print(f"Menu for {self.name}:")
        for item, price in self.menu.items():
            print(f"{item}: ${price:.2f}")

class Menu:
    def __init__(self):
        self.restaurants = {}

    def add_restaurant(self, restaurant):
        self.restaurants[restaurant.name] = restaurant

    def get_restaurant(self, name):
        return self.restaurants.get(name)

# Example Usage
if __name__ == '__main__':
    restaurant = Restaurant('Pasta Palace', 'Italian')
    restaurant.add_item('Spaghetti Carbonara', 12.99)
    restaurant.add_item('Margherita Pizza', 10.99)
    restaurant.display_menu()