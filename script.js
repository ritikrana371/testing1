    bindIfExists(form, "submit", async (event) => {
      event.preventDefault();

      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (!username || !password) {
        showMessage(document.getElementById("loginMessage"), "Please enter both username and password.", "error");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success) {
          sessionStorage.setItem(sessionKey, "true");
          window.location.href = "dashboard.html";
          return;
        }

        throw new Error(data.message || "Invalid username or password.");
      } catch (error) {
        if (validUsers[username] && validUsers[username] === password) {
          sessionStorage.setItem(sessionKey, "true");
          window.location.href = "dashboard.html";
          return;
        }

        showMessage(
          document.getElementById("loginMessage"),
          error.message || "Unable to reach the backend. Please try again later.",
          "error"
        );
        form.reset();
      }
    });
