const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const http = require('https');

// Helper to fetch resource
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

console.log("Simulating full live browser load and click navigation...");

Promise.all([
  fetchUrl('https://financeiropdtnovo.web.app/'),
  fetchUrl('https://financeiropdtnovo.web.app/assets/index-D0jhD8OW.js')
]).then(([html, jsCode]) => {
  console.log("Successfully fetched index.html and index.js from production URL!");
  
  // Mock Chart
  const chartMock = `
  class Chart {
    constructor(ctx, config) {
      this.ctx = ctx;
      this.config = config;
    }
    destroy() {}
  }
  window.Chart = Chart;
  `;
  
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable"
  });
  
  const { window } = dom;
  const { document: doc } = window;
  
  // Inject mock Chart
  window.eval(chartMock);
  
  // Intercept any console errors
  const originalError = window.console.error;
  let hasError = false;
  window.console.error = function(...args) {
    hasError = true;
    console.error("BROWSER CONSOLE ERROR:", ...args);
  };
  
  // Evaluate the Vite bundle in JSDOM context
  window.eval(jsCode);
  
  // Wait for initial onload / DOMContentLoaded callbacks
  setTimeout(() => {
    try {
      console.log("System page loaded.");
      console.log("Initial active title:", doc.getElementById('active-view-title').textContent);
      
      // Locate the general sidebar negotiations link
      const links = doc.querySelectorAll('.submenu-link');
      const negLink = Array.from(links).find(l => l.getAttribute('data-view') === 'financial-negotiations');
      console.log("Negotiations link in sidebar found:", !!negLink);
      
      if (!negLink) {
        console.error("Failure: Negotiations link missing from sidebar!");
        process.exit(1);
      }
      
      // Simulate click
      console.log("Simulating click on Negotiations link...");
      negLink.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
      
      // Wait for view transition
      setTimeout(() => {
        const negSection = doc.getElementById('view-financial-negotiations');
        console.log("Negotiations section style.display:", negSection ? negSection.style.display : "null");
        
        const firstRowHeader = doc.querySelector('#revenue-neg-table-body tr td');
        console.log("First row of revenue table content:", firstRowHeader ? firstRowHeader.textContent : "null");
        
        const firstInstallmentRow = doc.querySelector('#neg-advanced-param-rows tr td');
        console.log("First row of advanced parameters:", firstInstallmentRow ? firstInstallmentRow.textContent : "null");
        
        if (negSection && negSection.style.display === 'flex' && firstRowHeader && firstRowHeader.textContent !== 'null') {
          console.log("TEST SUCCESSFUL! Live code displays and renders negotiations correctly!");
          process.exit(0);
        } else {
          console.error("Failure: Negotiations view not showing or empty!");
          process.exit(1);
        }
      }, 500);
      
    } catch (err) {
      console.error("Execution error during JSDOM simulation:", err);
      process.exit(1);
    }
  }, 1000);
}).catch(err => {
  console.error("HTTP Fetch failed:", err);
  process.exit(1);
});
