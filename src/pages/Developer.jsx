import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Developer() {
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <style>{`
        .profile-hero {
          background: linear-gradient(135deg, var(--ieee-dark) 0%, #001f42 100%);
          padding: 8rem 0 5rem 0;
          color: var(--ieee-white);
          border-bottom: 3px solid var(--ieee-primary);
        }
        .profile-avatar-large-container {
          position: relative;
          display: inline-block;
          border-radius: 50%;
          padding: 6px;
          background: linear-gradient(135deg, var(--ieee-primary) 0%, var(--ieee-white) 100%);
          box-shadow: 0 8px 30px rgba(0, 180, 216, 0.4);
          transition: transform var(--ieee-transition);
        }
        .profile-avatar-large-container:hover {
          transform: scale(1.03);
        }
        .profile-avatar-large {
          width: 220px;
          height: 220px;
          object-fit: cover;
          border-radius: 50%;
          border: 5px solid #002147;
        }
        .profile-title {
          font-size: 2.8rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 0.5rem;
          background: linear-gradient(90deg, #ffffff 0%, #cceeff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .profile-tagline {
          font-size: 1.15rem;
          color: #d1ecf1;
          line-height: 1.6;
          margin-bottom: 2rem;
          max-width: 800px;
        }
        .profile-badge {
          display: inline-block;
          background: rgba(var(--ieee-primary-rgb), 0.15);
          color: var(--ieee-primary);
          padding: 0.4rem 1rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid rgba(var(--ieee-primary-rgb), 0.35);
          margin: 0.25rem;
        }
        .portfolio-card {
          background: var(--ieee-white);
          border-radius: var(--ieee-radius-lg);
          box-shadow: var(--ieee-shadow-sm);
          border: 1px solid rgba(0, 0, 0, 0.05);
          padding: 2.2rem;
          height: 100%;
          transition: all var(--ieee-transition);
        }
        .portfolio-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--ieee-shadow-md);
          border-color: rgba(var(--ieee-primary-rgb), 0.25);
        }
        .portfolio-card-title {
          color: var(--ieee-brand-blue);
          font-weight: 700;
          border-bottom: 2px solid rgba(var(--ieee-primary-rgb), 0.15);
          padding-bottom: 0.75rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .portfolio-card-title i {
          color: var(--ieee-primary);
          font-size: 1.4rem;
        }
        .timeline-item {
          position: relative;
          padding-left: 25px;
          border-left: 2px solid rgba(var(--ieee-primary-rgb), 0.2);
          margin-bottom: 1.5rem;
        }
        .timeline-item::before {
          content: '';
          position: absolute;
          left: -6px;
          top: 6px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--ieee-primary);
        }
        .timeline-title {
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 0.15rem;
          color: var(--ieee-brand-blue);
        }
        .timeline-meta {
          font-size: 0.8rem;
          color: var(--ieee-secondary);
          margin-bottom: 0.5rem;
        }
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .skill-tag {
          background: var(--ieee-light);
          color: var(--ieee-brand-blue);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--ieee-radius);
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all var(--ieee-transition);
        }
        .skill-tag:hover {
          background: var(--ieee-primary);
          color: var(--ieee-white);
          border-color: var(--ieee-primary);
        }
      `}</style>

      <header className="profile-hero">
        <div className="container px-4 px-lg-5">
          <div className="row align-items-center justify-content-center text-center text-lg-start">
            <div className="col-lg-3 text-center mb-4 mb-lg-0 reveal">
              <div className="profile-avatar-large-container">
                <img src="/assets/yousef.png" alt="Yousef Ali" className="profile-avatar-large" />
              </div>
            </div>
            <div className="col-lg-9 ps-lg-5 reveal">
              <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-2 mb-3">
                <span className="profile-badge">NLP & ML Engineer</span>
                <span className="profile-badge">ASP.NET Backend Developer</span>
                <span className="profile-badge">Junior Teaching Assistant</span>
              </div>
              <h1 className="profile-title" style={{ color: '#fff', webkitTextFillColor: 'unset' }}>Yousef Mahmoud Ali</h1>
              <p className="profile-tagline">
                Computer Vision Intern @ NAID | SWE Mentor & Facilitator @ IEEE NU | Junior Teaching Assistant | ASP .NET Developer Enthusiast | ML & NLP Researcher | Student @ Nile University | Google Developer Groups & ITI Certified
              </p>
              <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-3">
                <a href="mailto:YousefMahmoudAli@outlook.com" className="btn btn-ieee btn-ieee-primary d-flex align-items-center gap-2">
                  <i className="bi bi-envelope-fill"></i> Contact Me
                </a>
                <a href="https://github.com/YousefAliMLS" target="_blank" rel="noopener noreferrer" className="btn btn-ieee btn-ieee-outline d-flex align-items-center gap-2">
                  <i className="bi bi-github"></i> GitHub
                </a>
                <a href="https://www.linkedin.com/in/yousef-ali-b38153304/" target="_blank" rel="noopener noreferrer" className="btn btn-ieee btn-ieee-outline d-flex align-items-center gap-2">
                  <i className="bi bi-linkedin"></i> LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="py-5 bg-ieee-light">
        <div className="container px-4 px-lg-5">
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="row g-4">
                <div className="col-12 reveal">
                  <div className="portfolio-card">
                    <h3 className="portfolio-card-title">
                      <i className="bi bi-person-fill"></i> Professional Summary
                    </h3>
                    <p style={{ lineHeight: '1.7', color: 'var(--ieee-secondary)' }}>
                      I am a Computer Science student with a strong foundation in backend development, AI, and software engineering. I am passionate about building scalable systems and AI-driven solutions.
                    </p>
                    <p style={{ lineHeight: '1.7', color: 'var(--ieee-secondary)' }}>
                      I have hands-on experience in mentoring, leading software projects, and hardware troubleshooting. My technical expertise spans python, C++, machine learning, NLP engineering, and building robust backends with ASP.NET Core.
                    </p>
                  </div>
                </div>

                <div className="col-12 reveal">
                  <div className="portfolio-card">
                    <h3 className="portfolio-card-title">
                      <i className="bi bi-tools"></i> Technical Expertise
                    </h3>
                    <h5 className="mt-3 text-muted" style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>Programming Languages</h5>
                    <div className="skills-list mb-4">
                      <span className="skill-tag">Python</span>
                      <span className="skill-tag">C++</span>
                      <span className="skill-tag">C</span>
                      <span className="skill-tag">Java</span>
                      <span className="skill-tag">C#</span>
                      <span className="skill-tag">SQL</span>
                      <span className="skill-tag">HTML5 / CSS3</span>
                    </div>

                    <h5 className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>Backend & Engineering</h5>
                    <div className="skills-list mb-4">
                      <span className="skill-tag">Backend Dev</span>
                      <span className="skill-tag">REST APIs</span>
                      <span className="skill-tag">OOP</span>
                      <span className="skill-tag">Git & GitHub</span>
                      <span className="skill-tag">CI/CD</span>
                      <span className="skill-tag">ASP.NET Core</span>
                      <span className="skill-tag">Microsoft Azure</span>
                      <span className="skill-tag">Linux/UNIX</span>
                    </div>

                    <h5 className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>AI, ML & NLP</h5>
                    <div className="skills-list">
                      <span className="skill-tag">Machine Learning</span>
                      <span className="skill-tag">Natural Language Processing (NLP)</span>
                      <span className="skill-tag">LangChain</span>
                      <span className="skill-tag">Pandas</span>
                      <span className="skill-tag">Scikit-learn</span>
                      <span className="skill-tag">Hugging Face</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 reveal">
              <div className="portfolio-card">
                <h3 className="portfolio-card-title">
                  <i className="bi bi-briefcase-fill"></i> Experience
                </h3>
                
                <div className="timeline-item">
                  <h4 className="timeline-title">NLP Engineer Intern</h4>
                  <div className="timeline-meta">Cellula Technologies | Sep - Nov 2025</div>
                  <p className="text-muted small">built end-to-end NLP pipelines using LangChain, LangGraph, RAG, and Hugging Face (Transformers, BERT). Optimized LLM applications through prompt engineering and state graphs for complex agent development.</p>
                </div>

                <div className="timeline-item">
                  <h4 className="timeline-title">Machine Learning Engineer Intern</h4>
                  <div className="timeline-meta">Cellula Technologies | Jul - Aug 2025</div>
                  <p className="text-muted small">delivered 2 production-ready projects: Hotel Reservation Classification (Flask) and Uber Fare Prediction (Django). Built end-to-end ML pipelines including preprocessing, feature engineering, and model training.</p>
                </div>

                <div className="timeline-item">
                  <h4 className="timeline-title">Software Engineering Mentor & Member</h4>
                  <div className="timeline-meta">IEEE Nile University Student Branch | Dec 2025 - Present</div>
                  <p className="text-muted small">promoted to Mentor/Facilitator in March 2026; designed project guidelines, frameworks, and recorded tutorial sessions. Selected as a core member after competitive evaluation; participated in workshops and system design discussions.</p>
                </div>

                <div className="timeline-item">
                  <h4 className="timeline-title">Junior Teaching Assistant</h4>
                  <div className="timeline-meta">Nile University | Feb 2025 - Present</div>
                  <p className="text-muted small"><strong>Advanced Programming (Java) & Design and Analysis of Algorithms</strong> (Feb 2026 - Present): Guide students through OOP, algorithmic complexity, dynamic programming, and recurrence relations.</p>
                  <p className="text-muted small"><strong>Intermediate Programming (C and C++)</strong> (Feb - Jun 2025): Mentored 30+ students in C/C++; received Certificate of Appreciation for exceptional teaching.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-6 reveal">
              <div className="portfolio-card">
                <h3 className="portfolio-card-title">
                  <i className="bi bi-patch-check-fill"></i> Education & Certifications
                </h3>
                
                <div className="timeline-item">
                  <h4 className="timeline-title">Bachelor of Computer Science</h4>
                  <div className="timeline-meta">Nile University (NU) | 2023 - 2027 (Expected)</div>
                  <p className="text-muted small"><strong>CGPA:</strong> +3.80/4.0</p>
                  <p className="text-muted small"><strong>Honors:</strong> President's Honor (Fall 2025, 4.0/4.0 GPA) & Dean's Honor (Spring 2025, 3.8+/4.0 GPA)</p>
                  <p className="text-muted small"><strong>Relevant Coursework:</strong> Data Structures & Algorithms, Machine Learning, Software Engineering, Data Analysis.</p>
                </div>

                <div className="timeline-item">
                  <h4 className="timeline-title">Certifications</h4>
                  <ul className="text-muted small ps-3" style={{ listStyleType: 'disc' }}>
                    <li>Certificate of Appreciation -- JTA CSCI112 (Nile University) | Feb 2026</li>
                    <li>NLP Internship Certificate (Cellula Technologies) | Sep - Nov 2025</li>
                    <li>Web Development Using .NET (Information Technology Institute - ITI) | Aug - Sep 2025</li>
                    <li>ML Internship Certificate (Cellula Technologies) | Jun - Jul 2025</li>
                    <li>Software Engineering Certificate (Nile University GDG) | Feb - Jun 2025</li>
                    <li>Python & AI Certification (Ministry of Foreign Affairs) | Dec 2024 - Feb 2025</li>
                    <li>Embedded Systems Training -- Best Project Award (Nile University) | Jan - Jul 2024</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-lg-6 reveal">
              <div className="portfolio-card">
                <h3 className="portfolio-card-title">
                  <i className="bi bi-code-square"></i> Projects
                </h3>

                <div className="timeline-item">
                  <h4 className="timeline-title">Big Data Intrusion Detection System</h4>
                  <div className="timeline-meta">Apache Spark, MLlib | Apr 2026 - May 2026</div>
                  <p className="text-muted small">engineered a distributed IDS processing +11 GB of network logs using Spark, Docker, and Zeppelin. Implemented dual-engine anomaly detection (Z-scores & K-Means), achieving a 6.7x speedup over single-threaded Python.</p>
                </div>

                <div className="timeline-item">
                  <h4 className="timeline-title">Context-Aware AI Agent</h4>
                  <div className="timeline-meta">StreamLit, LangChain, GPT-4o | Oct 2025 - Nov 2025</div>
                  <p className="text-muted small">engineered a full-stack conversational agent handling context-dependent queries with memory using StreamLit. Orchestrated 4 custom LangChain tools (Context Splitter, Presence/Relevance Judges, and Wikipedia Search fallback).</p>
                </div>

                <div className="timeline-item">
                  <h4 className="timeline-title">CoreX Fitness Web Application</h4>
                  <div className="timeline-meta">ASP.NET 9.0 + Azure | Oct 2025 - Jan 2026</div>
                  <p className="text-muted small">full-stack fitness platform presented at 21st UGRF 2026. Backend built with ASP.NET Core 9.0, SQL Server, Azure, CI/CD. Integrated a context-aware AI fitness coach and personalized exercise generation using LLaMA 3.2 via OpenRouter API.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
