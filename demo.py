#!/usr/bin/env python3
"""
Demo script for the Audit Framework
This script demonstrates how to use the audit framework to track changes across multiple tables.
"""

import requests
import json
import time
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000/api"

def print_section(title):
    """Print a section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_step(step, description):
    """Print a step description"""
    print(f"\n{step}. {description}")

def make_request(method, endpoint, data=None):
    """Make an HTTP request to the API"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        elif method == "PUT":
            response = requests.put(url, json=data)
        elif method == "DELETE":
            response = requests.delete(url)
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        return None

def demo_audit_framework():
    """Demonstrate the audit framework functionality"""
    
    print_section("AUDIT FRAMEWORK DEMO")
    print("This demo will show how the audit framework tracks changes across multiple tables.")
    
    # Step 1: Create a transaction
    print_step(1, "Creating a transaction for user registration and product creation")
    
    transaction_data = {
        "description": "User registration and initial product setup",
        "user_id": None
    }
    
    transaction = make_request("POST", "/transactions", transaction_data)
    if not transaction:
        print("❌ Failed to create transaction")
        return
    
    transaction_id = transaction["transaction_id"]
    print(f"✅ Transaction created: {transaction_id}")
    
    # Step 2: Create a user (this will be tracked in the transaction)
    print_step(2, "Creating a new user")
    
    user_data = {
        "username": "demo_user",
        "email": "demo@example.com",
        "full_name": "Demo User",
        "is_active": True
    }
    
    user = make_request("POST", "/users", user_data)
    if not user:
        print("❌ Failed to create user")
        return
    
    print(f"✅ User created: {user['username']} (ID: {user['id']})")
    
    # Step 3: Create multiple products
    print_step(3, "Creating multiple products")
    
    products_data = [
        {
            "name": "Laptop",
            "description": "High-performance laptop",
            "price": 999.99,
            "category": "Electronics",
            "stock_quantity": 10
        },
        {
            "name": "Mouse",
            "description": "Wireless mouse",
            "price": 29.99,
            "category": "Electronics",
            "stock_quantity": 50
        },
        {
            "name": "Desk Chair",
            "description": "Ergonomic office chair",
            "price": 199.99,
            "category": "Furniture",
            "stock_quantity": 5
        }
    ]
    
    created_products = []
    for product_data in products_data:
        product = make_request("POST", "/products", product_data)
        if product:
            created_products.append(product)
            print(f"✅ Product created: {product['name']} (ID: {product['id']})")
    
    # Step 4: Update a product
    print_step(4, "Updating a product")
    
    if created_products:
        product_to_update = created_products[0]
        update_data = {
            "price": 899.99,
            "stock_quantity": 8
        }
        
        updated_product = make_request("PUT", f"/products/{product_to_update['id']}", update_data)
        if updated_product:
            print(f"✅ Product updated: {updated_product['name']}")
            print(f"   Price changed from ${product_to_update['price']} to ${updated_product['price']}")
            print(f"   Stock changed from {product_to_update['stock_quantity']} to {updated_product['stock_quantity']}")
    
    # Step 5: Complete the transaction
    print_step(5, "Completing the transaction")
    
    completion = make_request("POST", f"/transactions/{transaction_id}/complete")
    if completion:
        print("✅ Transaction completed successfully")
    
    # Step 6: View transaction audit
    print_step(6, "Viewing transaction audit")
    
    audit_data = make_request("GET", f"/audit/transactions/{transaction_id}")
    if audit_data:
        print(f"📊 Transaction Audit for: {transaction_id}")
        print(f"   Javers Changes: {len(audit_data.get('javers_changes', []))}")
        print(f"   Audit Logs: {len(audit_data.get('audit_logs', []))}")
        
        # Show some audit details
        for log in audit_data.get('audit_logs', [])[:3]:  # Show first 3 logs
            print(f"   - {log['entity_type']} {log['entity_id']}: {log['change_type']}")
    
    # Step 7: View recent audit logs
    print_step(7, "Viewing recent audit logs")
    
    recent_logs = make_request("GET", "/audit/recent?limit=5")
    if recent_logs:
        logs = recent_logs.get('audit_logs', [])
        print(f"📋 Recent Audit Logs ({len(logs)} entries):")
        for log in logs:
            print(f"   - {log['entity_type']} {log['entity_id']}: {log['change_type']} by {log.get('author', 'System')}")
    
    # Step 8: View audit summary
    print_step(8, "Viewing audit summary")
    
    summary = make_request("GET", "/audit/summary?days=1")
    if summary:
        print(f"📈 Audit Summary (Last {summary['period_days']} days):")
        print(f"   Total Audit Logs: {summary['total_audit_logs']}")
        print(f"   Unique Transactions: {summary['unique_transactions']}")
        print(f"   Change Types: {summary['change_type_breakdown']}")
        print(f"   Entity Types: {summary['entity_type_breakdown']}")
    
    print_section("DEMO COMPLETED")
    print("🎉 The audit framework has successfully tracked all changes!")
    print("\nYou can now:")
    print("1. Visit http://localhost:5173 to see the frontend")
    print("2. Visit http://localhost:8000/docs to see the API documentation")
    print("3. Explore the transaction details and audit logs")
    print("4. Create more transactions and see how changes are tracked")

if __name__ == "__main__":
    print("🚀 Starting Audit Framework Demo...")
    print("Make sure both backend and frontend servers are running!")
    print("Backend: http://localhost:8000")
    print("Frontend: http://localhost:5173")
    
    # Wait a moment for servers to be ready
    time.sleep(2)
    
    try:
        demo_audit_framework()
    except KeyboardInterrupt:
        print("\n\n🛑 Demo interrupted by user")
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        print("Make sure both servers are running and try again.")
