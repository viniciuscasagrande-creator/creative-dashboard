const { JSDOM } = require('jsdom');

console.log("Fetching live site content...");
JSDOM.fromURL('https://financeiropdtnovo.web.app/', {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  const { window } = dom;
  const { document: doc } = window;
  
  // Wait a bit for async scripts to execute, then simulate click and check
  setTimeout(() => {
    try {
      console.log("Checking page title:", doc.title);
      
      // Find the negotiations sidebar link
      const links = doc.querySelectorAll('.submenu-link');
      const negLink = Array.from(links).find(l => l.getAttribute('data-view') === 'financial-negotiations');
      console.log("Negotiations link found:", !!negLink);
      
      if (negLink) {
        // Simulate click!
        negLink.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
        console.log("Clicked Negotiations link.");
      } else {
        console.error("Negotiations link not found in DOM!");
        process.exit(1);
      }
      
      // Let view switch animation run
      setTimeout(() => {
        const negSection = doc.getElementById('view-financial-negotiations');
        console.log("Negotiations section display style after click:", negSection ? negSection.style.display : "null");
        
        const negSelect = doc.getElementById('neg-event-select');
        console.log("Negotiations event select options count after click:", negSelect ? negSelect.children.length : "null");
        
        if (!negSection || negSection.style.display !== 'flex' || !negSelect || negSelect.children.length === 0) {
          console.error("Negotiations view failed to display or populate!");
          process.exit(1);
        }
        
        console.log("Live site check completed successfully!");
        process.exit(0);
      }, 500);
      
    } catch (err) {
      console.error("Error during live check:", err);
      process.exit(1);
    }
  }, 3000);
}).catch(err => {
  console.error("Failed to load live site URL:", err);
  process.exit(1);
});
