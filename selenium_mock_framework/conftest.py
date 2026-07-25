import pytest
from selenium import webdriver
import json
import os

@pytest.fixture(scope="session")
def config():
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    with open(config_path) as f:
        return json.load(f)

@pytest.fixture(scope="function")
def driver(config):
    if config["mode"] == "mock":
        yield None
    else:
        if config["browser"] == "chrome":
            options = webdriver.ChromeOptions()
            options.add_argument("--headless")
            driver = webdriver.Chrome(options=options)
        else:
            raise ValueError(f"Unsupported browser: {config['browser']}")
        
        driver.implicitly_wait(config["implicit_wait"])
        yield driver
        driver.quit()
