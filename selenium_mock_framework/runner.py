import argparse
import json
import os
import time
import pytest
from utils.logger import log
from utils.reporter import Reporter
from utils.mock_generator import generate_mock_tests

def run_mock_execution():
    log.info("Starting Mock Execution Mode")
    log.info("Simulating execution of 500 test cases...")
    
    # Simulate some time passing for realism
    time.sleep(2)
    
    results, summary = generate_mock_tests(count=500)
    
    reporter = Reporter()
    excel_file = reporter.generate_excel_report(results, summary)
    html_file = reporter.generate_html_report(results, summary)
    
    log.info(f"Mock execution complete. 100% Pass Rate simulated.")
    log.info(f"Excel Report: {excel_file}")
    log.info(f"HTML Report: {html_file}")

def run_real_execution():
    log.info("Starting Real Execution Mode")
    tests_dir = os.path.join(os.path.dirname(__file__), "tests")
    pytest.main([tests_dir, "-v", "--html=reports/html/report.html"])

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Selenium Automation Framework Runner")
    parser.add_argument("--mode", choices=["mock", "real"], default="mock", help="Execution mode")
    args = parser.parse_args()
    
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    with open(config_path, "r") as f:
        config = json.load(f)
    
    if args.mode == "mock" or config.get("mode") == "mock":
        run_mock_execution()
    else:
        run_real_execution()
