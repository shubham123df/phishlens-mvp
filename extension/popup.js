document.addEventListener('DOMContentLoaded', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let url = tabs[0].url;

        // Call backend /check
        fetch("http://127.0.0.1:5000/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url })
        })
        .then(res => res.json())
        .then(data => {
            let resultDiv = document.getElementById("result");
            let reportBtn = document.getElementById("reportBtn");
            if (data.probability > 0.5) {
                resultDiv.innerHTML = "⚠️ Suspicious (" + (data.probability*100).toFixed(1) + "%)";
                resultDiv.className = "suspicious";
                reportBtn.style.display = "block";
                reportBtn.onclick = function () {
                    fetch("http://127.0.0.1:5000/report", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: url })
                    })
                    .then(r => r.json())
                    .then(d => alert(d.message));
                }
            } else {
                resultDiv.innerHTML = "✅ Safe (" + (data.probability*100).toFixed(1) + "%)";
                resultDiv.className = "safe";
            }
        })
        .catch(err => {
            document.getElementById("result").innerHTML = "Error: Backend not running";
        });
    });
});
