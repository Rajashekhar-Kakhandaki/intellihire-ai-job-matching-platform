const aiBtn = document.getElementById("ai-generate");
const descBox = document.getElementById("description");

aiBtn.addEventListener("click", async () => {
  const title = document.getElementById("title").value;
  const skills = document.getElementById("requiredSkills").value;
  const experience = document.getElementById("experience").value;
  const companyName = document.getElementById("companyName").value;

  if (!title || !skills || !experience) {
    alert("Please fill title, skills and experience first");
    return;
  }
 console.log(title,skills,experience,companyName);
  aiBtn.disabled = true;
  aiBtn.innerText = "Generating...";

  try {
    const res = await fetch("/ai/job-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        skills,
        experience,
        companyName
      })
    });

    const data = await res.json();

    if (data.description) {
      descBox.value = data.description ||"";
    } else {
      alert("AI failed to generate description");
    }
  } catch (err) {
    alert("Server error");
  }

  aiBtn.disabled = false;
  aiBtn.innerText = "✨ Generate with AI";
});