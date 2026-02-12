# Main Food Delivery Application

class FoodDeliveryApp:
    def __init__(self):
        self.orders = []
        self.menu = {
            'Pizza': 10,
            'Burger': 5,
            'Sushi': 15
        }

    def display_menu(self):
        print("Menu:")
        for item, price in self.menu.items():
            print(f'{item}: ${price}')

    def take_order(self, item):
        if item in self.menu:
            self.orders.append(item)
            print(f'Order placed for {item}.')
        else:
            print(f'Sorry, {item} is not on the menu.')

    def view_orders(self):
        print("Current Orders:")
        for order in self.orders:
            print(order)

if __name__ == '__main__':
    app = FoodDeliveryApp()
    app.display_menu()
    app.take_order('Pizza')
    app.view_orders()