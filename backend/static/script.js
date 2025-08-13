let historyList = [];

document.getElementById("checkBtn").addEventListener("click", function () {
    let url = document.getElementById("urlInput").value;
    if (!url) { alert("Please enter a URL"); return; }

    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("resultCard").classList.add("hidden");

    fetch("/check", {  // ✅ Now calls backend directly
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("loading").classList.add("hidden");
        document.getElementById("resultCard").classList.remove("hidden");

        let statusEl = document.getElementById("status");
        let scoreEl = document.getElementById("score");
        let reasonEl = document.getElementById("reason");
        let reportBtn = document.getElementById("reportBtn");

        let probability = Math.round((data.probability || 0) * 100);
        scoreEl.innerText = `Risk Score: ${probability}%`;

        if (probability > 70) {
            statusEl.innerText = "🚨 Suspicious!";
            statusEl.parentElement.className = "suspicious";
            reasonEl.innerText = "High chance of phishing.";
            reportBtn.classList.remove("hidden");
        } else if (probability > 40) {
            statusEl.innerText = "⚠️ Warning!";
            statusEl.parentElement.className = "warning";
            reasonEl.innerText = "Some suspicious patterns found.";
            reportBtn.classList.remove("hidden");
        } else {
            statusEl.innerText = "✅ Safe";
            statusEl.parentElement.className = "safe";
            reasonEl.innerText = "Looks safe.";
            reportBtn.classList.add("hidden");
        }

        historyList.unshift(url);
        if (historyList.length > 5) historyList.pop();
        renderHistory();

        reportBtn.onclick = () => {
            fetch("/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: url })
            })
            .then(res => res.json())
            .then(resp => alert(resp.message))
            .catch(err => alert("Error reporting link"));
        };
    })
    .catch(err => {
        console.error(err);
        alert("Error checking URL");
    });
});

function renderHistory() {
    let list = document.getElementById("historyList");
    list.innerHTML = "";
    historyList.forEach(item => {
        let li = document.createElement("li");
        li.innerText = item;
        list.appendChild(li);
    });
}

// Load reported links
fetch("/reports")
.then(res => res.json())
.then(data => {
    let list = document.getElementById("reportList");
    list.innerHTML = "";
    if (data.length === 0) {
        list.innerHTML = "<li>No reports yet.</li>";
    } else {
        data.forEach(url => {
            let li = document.createElement("li");
            li.textContent = url;
            list.appendChild(li);
        });
    }
});


