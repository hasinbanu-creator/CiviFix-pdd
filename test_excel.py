from selenium_tests.run_tests import SeleniumTestRunner

runner = SeleniumTestRunner()
# populate dummy data
runner.test_results = [
    {
        "test_id": f"SEL-TC-{i:03d}",
        "module": "Dashboard",
        "scenario": f"test_case_{i}",
        "status": "Passed",
        "error_msg": "",
        "browser": "Chrome Headless",
        "execution_time": 1.5
    } for i in range(1, 10)
]
runner.generate_excel_report()
print("Success")
