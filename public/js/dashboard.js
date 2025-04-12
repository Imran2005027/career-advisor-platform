// public/js/dashboard.js

// Ensure the user is logged in
const token = localStorage.getItem("authToken");
if (!token) {
  window.location.href = "login.html";
}

// Tab switching functionality
const tabLinks = document.querySelectorAll(".tab-link");
const tabContents = document.querySelectorAll(".tab-content");

tabLinks.forEach(link => {
  link.addEventListener("click", () => {
    tabLinks.forEach(l => l.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    link.classList.add("active");
    document.getElementById(link.dataset.tab).classList.add("active");
  });
});

// Utility function for showing a loading state on buttons
function setLoading(button, isLoading, originalText) {
  if (isLoading) {
    button.disabled = true;
    button.innerText = "Loading...";
  } else {
    button.disabled = false;
    button.innerText = originalText;
  }
}

// Generate Roadmap
document.getElementById("roadmapForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const generateBtn = e.target.querySelector("button[type='submit']");
  const originalText = "Generate Roadmap";
  setLoading(generateBtn, true, originalText);
  
  const careerGoal = document.getElementById("careerGoal").value;
  
  const response = await fetch("/career-advice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ careerGoal })
  });
  const data = await response.json();
  if(data.success) {
    document.getElementById("roadmapResult").innerHTML = data.roadmap;
  } else {
    document.getElementById("roadmapResult").innerText = "Error generating roadmap.";
  }
  
  setLoading(generateBtn, false, originalText);
});

// Save Roadmap
document.getElementById("saveRoadmap").addEventListener("click", async function() {
  const roadmapContent = document.getElementById("roadmapResult").innerHTML;
  if (!roadmapContent) {
    alert("No roadmap to save.");
    return;
  }
  const response = await fetch("/save-roadmap", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ roadmap: roadmapContent })
  });
  const data = await response.json();
  if(data.success) {
    alert("Roadmap saved successfully!");
    loadSavedItems();
  } else {
    alert("Failed to save roadmap: " + data.error);
  }
});

// Job Search
document.getElementById("jobSearchForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const searchBtn = e.target.querySelector("button[type='submit']");
  const originalText = "Search Jobs";
  setLoading(searchBtn, true, originalText);
  
  const careerGoal = document.getElementById("jobCareerGoal").value;
  const location = document.getElementById("location").value;
  
  const response = await fetch("/job-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ careerGoal, location })
  });
  
  const data = await response.json();
  let html = "<h3>Job Listings</h3>";
  if (data.success && data.jobs && data.jobs.length > 0) {
    data.jobs.forEach(job => {
      html += `
        <div class="job">
          <h4>${job.job_title || job.title}</h4>
          <p><strong>Company:</strong> ${job.employer_name || job.company_name}</p>
          <p><strong>Location:</strong> ${job.job_city || job.location || "N/A"}</p>
          <a href="${job.job_apply_link || job.url || '#'}" target="_blank">Apply Now</a>
        </div>
        <hr/>
      `;
    });
  } else {
    html += "<p>No related jobs found.</p>";
  }
  document.getElementById("jobResults").innerHTML = html;
  setLoading(searchBtn, false, originalText);
});

// Save Job Results
document.getElementById("saveJob").addEventListener("click", async function() {
  const jobContent = document.getElementById("jobResults").innerHTML;
  if (!jobContent) {
    alert("No job results to save.");
    return;
  }
  const response = await fetch("/save-job", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ job: jobContent })
  });
  const data = await response.json();
  if(data.success) {
    alert("Job results saved successfully!");
    loadSavedItems();
  } else {
    alert("Failed to save job results: " + data.error);
  }
});

// Load saved items from the dashboard endpoint
async function loadSavedItems() {
  const response = await fetch("/dashboard", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    }
  });
  const data = await response.json();
  if(data.success) {
    let html = "";
    if(data.savedRoadmaps && data.savedRoadmaps.length > 0) {
      html += "<h3>Saved Roadmaps:</h3>";
      data.savedRoadmaps.forEach(item => {
        html += `<div class="saved-item">${item}</div>`;
      });
    }
    if(data.savedJobs && data.savedJobs.length > 0) {
      html += "<h3>Saved Job Searches:</h3>";
      data.savedJobs.forEach(item => {
        html += `<div class="saved-item">${item}</div>`;
      });
    }
    if(html === "") {
      html = "<p>No saved items.</p>";
    }
    document.getElementById("savedItems").innerHTML = html;
  } else {
    document.getElementById("savedItems").innerText = "Failed to load saved items.";
  }
}

// Clear saved items
document.getElementById("clearSaved").addEventListener("click", async function() {
  const response = await fetch("/clear-dashboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    }
  });
  const data = await response.json();
  if(data.success) {
    alert("Saved items cleared.");
    loadSavedItems();
  } else {
    alert("Failed to clear saved items.");
  }
});

// Logout functionality
document.getElementById("logout").addEventListener("click", function() {
  localStorage.removeItem("authToken");
  window.location.href = "login.html";
});

// Initially load saved items on page load
loadSavedItems();
