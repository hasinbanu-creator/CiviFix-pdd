import random
import time
from datetime import datetime, timedelta

MODULES = [
    "Login", "Registration", "OTP", "Forgot Password", "Dashboard",
    "Raise Complaint", "Complaint History", "Complaint Tracking",
    "Profile", "Image Upload", "Notifications", "Inspector Module",
    "Admin Module", "Search", "Filters", "Logout", "API Validation",
    "UI Validation", "Security Checks", "Responsive UI", "Cross-browser"
]

TEST_ACTIONS = [
    "Verify successful", "Validate invalid input for", "Check edge case in",
    "Test boundaries for", "Confirm UI elements on", "Ensure fast response for"
]

def generate_mock_tests(count=500):
    test_results = []
    
    for i in range(1, count + 1):
        module = random.choice(MODULES)
        action = random.choice(TEST_ACTIONS)
        
        # Generate a realistic time between 1.2s and 5.5s
        exec_time = round(random.uniform(1.2, 5.5), 2)
        
        # Mock mode enforces 100% pass rate
        status = "Pass"
        remarks = "Simulated successful execution for demonstration"
        
        test_results.append({
            "id": f"TC-{i:04d}",
            "module": module,
            "name": f"{action} {module.lower()}",
            "priority": random.choice(["High", "Medium", "Low"]),
            "time": exec_time,
            "status": status,
            "remarks": remarks,
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
        
    summary = {
        "total": count,
        "executed": count,
        "passed": count,
        "failed": 0,
        "skipped": 0,
        "pass_percentage": 100.0
    }
    
    return test_results, summary
