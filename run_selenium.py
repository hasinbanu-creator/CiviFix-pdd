from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import time

def run():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get('http://localhost:3000/login')
        
        # Login
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="email"]')))
        driver.find_element(By.CSS_SELECTOR, 'input[type="email"]').send_keys('test@civifix.com')
        driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()
        
        # OTP
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'input[name="otp"]')))
        driver.find_element(By.CSS_SELECTOR, 'input[name="otp"]').send_keys('123456')
        driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()
        
        # Wait for dashboard
        time.sleep(2)
        
        # Go to create complaint
        driver.get('http://localhost:3000/complaints/create')
        
        # Wait for form
        time.sleep(2)
        
        # Fill form
        select_elements = driver.find_elements(By.TAG_NAME, 'select')
        if select_elements:
            Select(select_elements[0]).select_by_index(1)
        
        textareas = driver.find_elements(By.TAG_NAME, 'textarea')
        if textareas:
            textareas[0].send_keys('This is a valid description longer than 10 chars')
        
        # Click "Use my current location"
        buttons = driver.find_elements(By.TAG_NAME, 'button')
        for b in buttons:
            if 'Use my current location' in b.text:
                b.click()
                break
                
        time.sleep(1)
        
        # Submit
        for b in buttons:
            if 'SUBMIT COMPLAINT' in b.text.upper():
                b.click()
                break
                
        time.sleep(3)
        
        # Dump browser console logs
        for entry in driver.get_log('browser'):
            print(entry)
            
    finally:
        driver.quit()

if __name__ == "__main__":
    run()
