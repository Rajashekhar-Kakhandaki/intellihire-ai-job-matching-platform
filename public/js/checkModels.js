const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const listModels = async () => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    
    // In the standard JS SDK, you access the generative model list like this:
    // Note: Some versions use genAI.getGenerativeModel({ model: "..." }) 
    // but to LIST them, we often use the fetch/REST approach or the specific helper:
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.API_KEY}`);
    const data = await response.json();

    console.log("--- Available Models ---");
    if (data.models) {
      data.models.forEach(m => {
        console.log(`Model ID: ${m.name}`);
      });
    } else {
      console.log("No models found. Check your API Key.");
      console.log(data); // Log the error response from Google
    }
  } catch (error) {
    console.error("Connection Error:", error);
  }
};

listModels();