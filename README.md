🚀 IntelliHire – AI Hiring & Job Portal

IntelliHire is a full-stack AI-powered hiring and job portal that connects recruiters and job seekers through intelligent job matching, transparent shortlisting, and interview preparation tools.

The platform leverages AI (Google Gemini API) to make recruitment smarter, faster, and more explainable.

📌 Features

👤 Job Seeker Features

AI-based job recommendations using skill & experience matching

Fit score with detailed breakdown (skills, experience, resume quality)

AI Interview Preparation with role-specific questions

Skill gap analysis & learning guidance

Track application status in real time

Notifications & email alerts for updates


🧑‍💼 Recruiter Features

Post, edit, and manage job listings

View applicants ranked by AI fit score

Explainable AI match explanation for every candidate

Smart auto-shortlisting of top candidates

AI interview question generation per job or candidate

Applicant status management with notifications & emails


🧠 AI Capabilities

AI job–candidate matching

Explainable AI (why a candidate fits or not)

AI interview question generation (technical, HR, scenario-based)

Resume quality analysis

Skill gap identification



🏗️ System Architecture (High Level)

Client (Browser)
   ↓
EJS Templates (UI Rendering)
   ↓
Express.js Server (Node.js)
   ↓
MongoDB Database
   ↓
Google Gemini AI API

Frontend: EJS, HTML, CSS, JavaScript

Backend: Node.js, Express.js

Database: MongoDB (Mongoose)

AI Services: Google Gemini API


🛠️ Tech Stack

Backend: Node.js, Express.js

Frontend: EJS, HTML, CSS, JavaScript

Database: MongoDB

AI Integration: Google Gemini API

Authentication: Session-based authentication

Notifications: In-app + Email



🔐 Security & Best Practices

Role-based access (Recruiter / Seeker)

Environment variables for secrets

Secure authentication & authorization

.gitignore to protect sensitive data




📂 Project Structure (Simplified)

intellihire/
│
├── controllers/
├── models/
├── routes/
├── views/
│   ├── users/
│   ├── jobs/
│
├── public/
│   ├── css/
│   ├── images/
│
├── utils/
│   ├── aiMatchExplanation.js
│   ├── interviewQuestions.js
│
├── .env
├── .gitignore
├── server.js
└── README.md




▶️ How to Run Locally

# Clone repository
git clone https://github.com/Rajashekhar-Kakhandaki/intellihire-ai-job-matching-platform.git

# Install dependencies
npm install

# Add environment variables
touch .env

# Start server
node app.js




📈 Project Highlights (For Viva)

Explainable AI in recruitment

Ethical & transparent shortlisting

AI-assisted interview preparation

Industry-relevant real-world problem

Scalable full-stack architecture




🎓 Academic Relevance

This project demonstrates:

Full-stack web development

AI integration in real applications

Database design & optimization

Clean MVC architecture

Practical use of AI in HRTech




👨‍💻 Developed By

1)Rajashekhar Kakhandaki
2)S Sai Teja
3)S Fiza
4)Priyanka Mandloi

Academic Project – AI-Powered Recruitment System

