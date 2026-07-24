const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Listen for the request to the API
  page.on('request', request => {
    if (request.url().includes('/api/v1/complaints') && request.method() === 'POST') {
      console.log('--- REQUEST TO BACKEND ---');
      console.log('URL:', request.url());
      console.log('Headers:', request.headers());
      console.log('Post Data:', request.postData());
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/v1/complaints') && response.request().method() === 'POST') {
      console.log('--- RESPONSE FROM BACKEND ---');
      console.log('Status:', response.status());
      try {
        console.log('Body:', await response.json());
      } catch(e) {
        console.log('Body Text:', await response.text());
      }
    }
  });

  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'test@civifix.com');
  await page.click('button[type="submit"]');
  await page.waitForSelector('input[name="otp"]');
  await page.fill('input[name="otp"]', '123456');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation();
  await page.goto('http://localhost:3000/complaints/create');
  
  // Wait for wards to load
  await page.waitForTimeout(2000);
  
  // Select ward
  const select = await page.$('select');
  if (select) {
    await select.selectOption({ index: 1 });
  }
  
  // Fill description
  const textareas = await page.$$('textarea');
  if (textareas.length > 0) {
    await textareas[0].fill('This is a valid description longer than 10 chars');
  }
  
  // Fill location
  await page.click('button:has-text("Use my current location")');
  await page.waitForTimeout(1000);
  
  await page.click('button:has-text("SUBMIT COMPLAINT")');
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
