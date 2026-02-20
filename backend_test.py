#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class TajikEatsAPITester:
    def __init__(self, base_url="https://tajik-eats-app.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {response.text}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Test seeding initial data"""
        print("\n🌱 Testing seed data...")
        success, response = self.run_test(
            "Seed initial data",
            "POST",
            "seed",
            200
        )
        return success

    def test_cities_endpoint(self):
        """Test cities endpoint"""
        print("\n🏙️ Testing cities...")
        success, response = self.run_test(
            "Get cities list",
            "GET", 
            "cities",
            200
        )
        
        if success and isinstance(response, list):
            expected_cities = ["Душанбе", "Худжанд", "Курган-Тюбе", "Куляб"]
            if all(city in response for city in expected_cities):
                self.log_test("Cities contain all expected values", True)
            else:
                self.log_test("Cities missing expected values", False, f"Got: {response}")
        
        return success

    def test_user_registration(self):
        """Test user registration"""
        print("\n👤 Testing user registration...")
        
        # Generate unique test user
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_user_{timestamp}@example.com"
        
        user_data = {
            "name": f"Test User {timestamp}",
            "email": test_email,
            "password": "testpass123",
            "city": "Душанбе"
        }
        
        success, response = self.run_test(
            "Register new user",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.log_test("Token received from registration", True)
        
        return success

    def test_user_login(self):
        """Test user login with existing credentials"""
        print("\n🔐 Testing user login...")
        
        if not self.token:
            self.log_test("Login test skipped", False, "No token from registration")
            return False
            
        # Test getting current user info
        success, response = self.run_test(
            "Get current user info",
            "GET",
            "auth/me",
            200
        )
        
        return success

    def test_restaurants(self):
        """Test restaurant endpoints"""
        print("\n🍽️ Testing restaurants...")
        
        # Get all restaurants
        success, restaurants = self.run_test(
            "Get all restaurants",
            "GET",
            "restaurants",
            200
        )
        
        if not success or not restaurants:
            return False
            
        # Test filtering by city
        success, city_restaurants = self.run_test(
            "Get restaurants by city (Душанбе)",
            "GET",
            "restaurants?city=Душанбе",
            200
        )
        
        # Test specific restaurant
        if restaurants and len(restaurants) > 0:
            restaurant_id = restaurants[0]['id']
            success, restaurant = self.run_test(
                "Get specific restaurant",
                "GET",
                f"restaurants/{restaurant_id}",
                200
            )
            
            # Test restaurant menu
            success, menu = self.run_test(
                "Get restaurant menu",
                "GET",
                f"restaurants/{restaurant_id}/menu",
                200
            )
            
            # Test menu categories
            success, categories = self.run_test(
                "Get menu categories",
                "GET",
                f"menu-categories/{restaurant_id}",
                200
            )
            
            return success
        
        return False

    def test_cart_operations(self):
        """Test cart functionality"""
        print("\n🛒 Testing cart operations...")
        
        if not self.token:
            self.log_test("Cart tests skipped", False, "No authentication token")
            return False
        
        # Get empty cart
        success, cart = self.run_test(
            "Get empty cart",
            "GET",
            "cart",
            200
        )
        
        # Get restaurants to find menu items
        success, restaurants = self.run_test(
            "Get restaurants for cart test",
            "GET",
            "restaurants",
            200
        )
        
        if success and restaurants:
            restaurant_id = restaurants[0]['id']
            
            # Get menu items
            success, menu_items = self.run_test(
                "Get menu items for cart test",
                "GET",
                f"restaurants/{restaurant_id}/menu",
                200
            )
            
            if success and menu_items:
                menu_item_id = menu_items[0]['id']
                
                # Add item to cart
                success, cart = self.run_test(
                    "Add item to cart",
                    "POST",
                    "cart/add",
                    200,
                    data={"menu_item_id": menu_item_id, "quantity": 2}
                )
                
                if success:
                    # Update cart item
                    success, cart = self.run_test(
                        "Update cart item quantity",
                        "POST",
                        "cart/update",
                        200,
                        data={"menu_item_id": menu_item_id, "quantity": 3}
                    )
                    
                    return success
        
        return False

    def test_order_creation(self):
        """Test order creation with cash payment"""
        print("\n📦 Testing order creation...")
        
        if not self.token:
            self.log_test("Order tests skipped", False, "No authentication token")
            return False
        
        # First ensure we have items in cart
        success, restaurants = self.run_test(
            "Get restaurants for order test",
            "GET",
            "restaurants",
            200
        )
        
        if success and restaurants:
            restaurant_id = restaurants[0]['id']
            
            # Get menu items
            success, menu_items = self.run_test(
                "Get menu items for order test",
                "GET",
                f"restaurants/{restaurant_id}/menu",
                200
            )
            
            if success and menu_items:
                menu_item_id = menu_items[0]['id']
                
                # Add item to cart first
                success, cart = self.run_test(
                    "Add item to cart for order",
                    "POST",
                    "cart/add",
                    200,
                    data={"menu_item_id": menu_item_id, "quantity": 1}
                )
                
                if success:
                    # Create order
                    order_data = {
                        "delivery_address": "Test Address, Dushanbe",
                        "phone": "+992123456789",
                        "comment": "Test order",
                        "payment_method": "cash"
                    }
                    
                    success, order = self.run_test(
                        "Create order with cash payment",
                        "POST",
                        "orders",
                        200,
                        data=order_data
                    )
                    
                    if success and 'id' in order:
                        order_id = order['id']
                        
                        # Get order details
                        success, order_detail = self.run_test(
                            "Get order details",
                            "GET",
                            f"orders/{order_id}",
                            200
                        )
                        
                        # Get user orders list
                        success, orders_list = self.run_test(
                            "Get user orders list",
                            "GET",
                            "orders",
                            200
                        )
                        
                        return success
        
        return False

    def test_favorites(self):
        """Test favorites functionality"""
        print("\n❤️ Testing favorites...")
        
        if not self.token:
            self.log_test("Favorites tests skipped", False, "No authentication token")
            return False
        
        # Get restaurants
        success, restaurants = self.run_test(
            "Get restaurants for favorites test",
            "GET",
            "restaurants",
            200
        )
        
        if success and restaurants:
            restaurant_id = restaurants[0]['id']
            
            # Add to favorites
            success, response = self.run_test(
                "Add restaurant to favorites",
                "POST",
                f"favorites/{restaurant_id}",
                200
            )
            
            if success:
                # Check favorite status
                success, fav_status = self.run_test(
                    "Check favorite status",
                    "GET",
                    f"favorites/check/{restaurant_id}",
                    200
                )
                
                # Get favorites list
                success, favorites = self.run_test(
                    "Get favorites list",
                    "GET",
                    "favorites",
                    200
                )
                
                # Remove from favorites
                success, response = self.run_test(
                    "Remove from favorites",
                    "DELETE",
                    f"favorites/{restaurant_id}",
                    200
                )
                
                return success
        
        return False

    def test_search_and_filter(self):
        """Test search and filtering"""
        print("\n🔍 Testing search and filtering...")
        
        # Test search
        success, search_results = self.run_test(
            "Search restaurants",
            "GET",
            "restaurants?search=плов",
            200
        )
        
        # Test cuisine filter
        success, cuisine_results = self.run_test(
            "Filter by cuisine",
            "GET",
            "restaurants?cuisine=Таджикская",
            200
        )
        
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Tajik Eats API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test basic endpoints
        self.test_seed_data()
        self.test_cities_endpoint()
        
        # Test authentication
        self.test_user_registration()
        self.test_user_login()
        
        # Test core functionality
        self.test_restaurants()
        self.test_search_and_filter()
        self.test_cart_operations()
        self.test_order_creation()
        self.test_favorites()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TajikEatsAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': tester.tests_passed/tester.tests_run if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())