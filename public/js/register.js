// public/js/register.js
document.getElementById("registerForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const registerBtn = e.target.querySelector("button[type='submit']");
    const originalText = "Register";
    registerBtn.disabled = true;
    registerBtn.innerText = "Loading...";
    
    const username = document.getElementById("registerUsername").value;
    const fullName = document.getElementById("registerFullName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    
    const response = await fetch("http://localhost:8080/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, fullName, email, password })
    });
    
    const data = await response.json();
    if(data.success) {
      alert("Registration successful! Please log in.");
      window.location.href = "login.html";
    } else {
      alert("Registration failed: " + data.error);
    }
    
    registerBtn.disabled = false;
    registerBtn.innerText = originalText;
  });
  