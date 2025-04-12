document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const loginBtn = e.target.querySelector("button[type='submit']");
  const originalText = "Login";
  loginBtn.disabled = true;
  loginBtn.innerText = "Loading...";

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
      alert("Please enter both email and password.");
      loginBtn.disabled = false;
      loginBtn.innerText = originalText;
      return;
  }
  console.log("Sending login request:", { email, password });
  try {
      const response = await fetch("http://localhost:8080/login ", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
          localStorage.setItem("authToken", data.token);
          window.location.href = "dashboard.html";
      } else {
          alert("Login failed: " + (data.error || "Unknown error"));
      }
  } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please check your credentials and try again.");
  }

  loginBtn.disabled = false;
  loginBtn.innerText = originalText;
});
