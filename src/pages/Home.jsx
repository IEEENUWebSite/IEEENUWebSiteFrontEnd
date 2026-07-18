import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const ICON_MAP = {
  'PR': 'bi-megaphone',
  'HR': 'bi-person-badge',
  'Media': 'bi-camera-reels',
  'Marketing': 'bi-graph-up-arrow',
  'Operations': 'bi-gear',
  'Hardware': 'bi-cpu',
  'Software': 'bi-code-slash'
};

function getCommitteeIcon(name) {
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (name.includes(key)) return icon;
  }
  return 'bi-people';
}

export default function Home() {
  const navigate = useNavigate();
  const [committees, setCommittees] = useState([]);
  const [loadingCommittees, setLoadingCommittees] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nuid, setNuid] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [firstChoice, setFirstChoice] = useState('');
  const [secondChoice, setSecondChoice] = useState('');
  const [bio, setBio] = useState('');
  const [pastExperience, setPastExperience] = useState('');
  const [whyJoin, setWhyJoin] = useState('');
  const [whatDoYouKnow, setWhatDoYouKnow] = useState('');

  const [recruitmentLoading, setRecruitmentLoading] = useState(false);
  const [recruitmentFeedback, setRecruitmentFeedback] = useState({ show: false, type: '', message: '' });
  const [recruitmentErrors, setRecruitmentErrors] = useState({});

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactFeedback, setContactFeedback] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    api.getCommittees()
      .then(data => {
        setCommittees(data);
        setLoadingCommittees(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingCommittees(false);
      });
  }, []);

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });
    reveals.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [committees]);

  const handleRecruitmentSubmit = async (e) => {
    e.preventDefault();
    setRecruitmentFeedback({ show: false, type: '', message: '' });
    setRecruitmentErrors({});

    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;

    if (!fullName.trim()) errors.fullName = 'Full name is required.';
    if (!emailRegex.test(email)) errors.email = 'Please enter a valid email address.';
    if (!phoneRegex.test(phone)) errors.phone = 'Please enter a valid phone number.';
    if (!nuid.trim()) errors.nuid = 'ID is required.';
    if (!faculty) errors.faculty = 'Please select a faculty.';
    if (!major.trim()) errors.major = 'Major is required.';
    if (!academicYear) errors.academicYear = 'Please select your academic year.';
    if (!firstChoice) errors.firstChoice = 'Please select a first choice committee.';
    if (!bio.trim()) errors.bio = 'Please tell us about yourself.';
    if (!whyJoin.trim()) errors.whyJoin = 'Please explain why you want to join.';
    if (!whatDoYouKnow.trim()) errors.whatDoYouKnow = 'Please share what you know about IEEE.';

    if (Object.keys(errors).length > 0) {
      setRecruitmentErrors(errors);
      return;
    }

    setRecruitmentLoading(true);

    const payload = {
      fullName,
      email,
      phone,
      nuid,
      faculty,
      major,
      academicYear,
      firstChoiceCommitteeId: parseInt(firstChoice, 10),
      secondChoiceCommitteeId: secondChoice ? parseInt(secondChoice, 10) : null,
      bio,
      pastExperience: pastExperience || null,
      whyJoin,
      whatDoYouKnow
    };

    try {
      await api.applyRecruitment(payload);
      setRecruitmentFeedback({
        show: true,
        type: 'success',
        message: 'Your application has been submitted successfully. We will review it and get back to you shortly.'
      });
      setFullName('');
      setEmail('');
      setPhone('');
      setNuid('');
      setFaculty('');
      setMajor('');
      setAcademicYear('');
      setFirstChoice('');
      setSecondChoice('');
      setBio('');
      setPastExperience('');
      setWhyJoin('');
      setWhatDoYouKnow('');
    } catch (err) {
      console.error(err);
      setRecruitmentFeedback({
        show: true,
        type: 'error',
        message: err.message || 'A network error occurred. Please check your connection and try again.'
      });
    } finally {
      setRecruitmentLoading(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactFeedback({ show: false, type: '', message: '' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!contactName.trim() || !emailRegex.test(contactEmail) || !contactSubject.trim() || !contactMessage.trim()) {
      setContactFeedback({
        show: true,
        type: 'error',
        message: 'Please fill in all fields with valid inputs.'
      });
      return;
    }

    setContactLoading(true);

    const payload = {
      fullName: contactName.trim(),
      email: contactEmail.trim(),
      subject: contactSubject.trim(),
      message: contactMessage.trim()
    };

    try {
      await api.submitContact(payload);
      setContactFeedback({
        show: true,
        type: 'success',
        message: 'Thank you for your message. We will get back to you shortly.'
      });
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    } catch (err) {
      console.error(err);
      setContactFeedback({
        show: true,
        type: 'error',
        message: err.message || 'A network error occurred. Please check your connection and try again.'
      });
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div>
      <header className="masthead">
        <div className="container px-4 px-lg-5">
          <div className="hero-glass-card">
            <div className="hero-content">
              <h1>Advancing Technology for Humanity</h1>
              <p className="hero-subtitle">
                Welcome to the IEEE Nile University Student Branch. We bridge the gap between academic theory and real-world industrial practice by fostering technical innovation, collaboration, and student-led development.
              </p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <a className="btn btn-ieee btn-ieee-primary btn-ieee-xl" href="#recruitment">Join Us Now</a>
                <a className="btn btn-ieee btn-ieee-outline btn-ieee-xl" href="#about">Learn More</a>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <i className="bi bi-chevron-double-down"></i>
        </div>
      </header>

      <section className="page-section about-section" id="about">
        <div className="container px-4 px-lg-5">
          <div className="row gx-4 gx-lg-5 justify-content-center">
            <div className="col-lg-8 text-center reveal">
              <h2 className="text-white mt-0">What is IEEE?</h2>
              <hr className="divider divider-light" />
              <p className="text-white-75 mb-5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                IEEE is the world's largest technical professional organization dedicated to advancing technology for the benefit of humanity. The Nile University Student Branch empowers students by providing hands-on training, workshops, and participation in national and international events.
              </p>
              <a className="btn btn-ieee btn-ieee-light btn-ieee-xl" href="#committees">View Our Committees</a>
            </div>
          </div>
          <div className="row gx-4 gx-lg-5 justify-content-center mt-5 reveal">
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <div className="stat-number">7</div>
                <div className="stat-label">Committees</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <div className="stat-number">150+</div>
                <div className="stat-label">Active Members</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <div className="stat-number">20+</div>
                <div className="stat-label">Events Yearly</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <div className="stat-number">2026</div>
                <div className="stat-label">Season</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section bg-ieee-light" id="committees">
        <div className="container px-4 px-lg-5">
          <div className="text-center reveal">
            <h2 className="mt-0">Our Committees</h2>
            <hr className="divider" />
            <p className="text-muted mb-5">Each committee plays a vital role in driving our branch forward. Find the one that matches your passion.</p>
          </div>
          <div className="row gx-4 gx-lg-5" id="committees-container">
            {loadingCommittees ? (
              <>
                {[1, 2, 3].map(n => (
                  <div key={n} className="col-lg-4 col-md-6 mb-4">
                    <div className="committee-card">
                      <div className="committee-icon skeleton skeleton-circle" style={{ margin: '0 auto 1.25rem' }}></div>
                      <div className="skeleton skeleton-text medium mx-auto" style={{ height: '1.25rem', marginBottom: '1rem' }}></div>
                      <div className="skeleton skeleton-text long mx-auto"></div>
                      <div className="skeleton skeleton-text mx-auto"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : committees.length > 0 ? (
              committees.map((c, idx) => {
                const icon = getCommitteeIcon(c.name);
                const delay = idx * 80;
                return (
                  <div key={c.id} className="col-lg-4 col-md-6 mb-4">
                    <div className="committee-card reveal" style={{ transitionDelay: `${delay}ms` }}>
                      <div className="committee-icon">
                        <i className={`bi ${icon}`}></i>
                      </div>
                      <h3>{c.name}</h3>
                      <p>{c.description || 'No description provided.'}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-12 text-center text-muted">
                <p>No committees configured yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="page-section recruitment-section" id="recruitment">
        <div className="container px-4 px-lg-5">
          <div className="row gx-4 gx-lg-5 justify-content-center">
            <div className="col-lg-8">
              <div className="text-center reveal">
                <h2 className="text-white mt-0">Member Recruitment 2026 - 2027 (Coming Soon)</h2>
                <hr className="divider divider-light" />
                <p className="mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Select your preferred committees, fill in your background information, and submit your application to join the IEEE Nile University Student Branch.
                </p>
              </div>

              <form id="recruitmentForm" onSubmit={handleRecruitmentSubmit} className="reveal" noValidate>
                <div className="row mb-3">
                  <div className="col-md-6 mb-3">
                    <div className="form-floating">
                      <input
                        type="text"
                        className={`form-control ${recruitmentErrors.fullName ? 'is-invalid' : ''}`}
                        id="fullName"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        maxLength="150"
                        required
                      />
                      <label htmlFor="fullName">Full Name</label>
                      <div className={`validation-message ${recruitmentErrors.fullName ? 'show' : ''}`}>{recruitmentErrors.fullName}</div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="form-floating">
                      <input
                        type="email"
                        className={`form-control ${recruitmentErrors.email ? 'is-invalid' : ''}`}
                        id="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength="100"
                        required
                      />
                      <label htmlFor="email">University / Personal Email</label>
                      <div className={`validation-message ${recruitmentErrors.email ? 'show' : ''}`}>{recruitmentErrors.email}</div>
                    </div>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6 mb-3">
                    <div className="form-floating">
                      <input
                        type="tel"
                        className={`form-control ${recruitmentErrors.phone ? 'is-invalid' : ''}`}
                        id="phone"
                        placeholder="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength="20"
                        required
                      />
                      <label htmlFor="phone">Phone Number</label>
                      <div className={`validation-message ${recruitmentErrors.phone ? 'show' : ''}`}>{recruitmentErrors.phone}</div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="form-floating">
                      <input
                        type="text"
                        className={`form-control ${recruitmentErrors.nuid ? 'is-invalid' : ''}`}
                        id="nuid"
                        placeholder="NU ID"
                        value={nuid}
                        onChange={(e) => setNuid(e.target.value)}
                        maxLength="50"
                        required
                      />
                      <label htmlFor="nuid">NU ID (or National ID)</label>
                      <div className={`validation-message ${recruitmentErrors.nuid ? 'show' : ''}`}>{recruitmentErrors.nuid}</div>
                    </div>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4 mb-3">
                    <div className="form-floating">
                      <select
                        className={`form-select ${recruitmentErrors.faculty ? 'is-invalid' : ''}`}
                        id="faculty"
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select Faculty</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Business">Business</option>
                        <option value="Biotechnology">Biotechnology</option>
                        <option value="Other">Other</option>
                      </select>
                      <label htmlFor="faculty">Faculty</label>
                      <div className={`validation-message ${recruitmentErrors.faculty ? 'show' : ''}`}>{recruitmentErrors.faculty}</div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="form-floating">
                      <input
                        type="text"
                        className={`form-control ${recruitmentErrors.major ? 'is-invalid' : ''}`}
                        id="major"
                        placeholder="Major"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        maxLength="100"
                        required
                      />
                      <label htmlFor="major">Major</label>
                      <div className={`validation-message ${recruitmentErrors.major ? 'show' : ''}`}>{recruitmentErrors.major}</div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="form-floating">
                      <select
                        className={`form-select ${recruitmentErrors.academicYear ? 'is-invalid' : ''}`}
                        id="academicYear"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select Year</option>
                        <option value="Freshman">Freshman</option>
                        <option value="Sophomore">Sophomore</option>
                        <option value="Junior">Junior</option>
                        <option value="Senior">Senior</option>
                      </select>
                      <label htmlFor="academicYear">Academic Year</label>
                      <div className={`validation-message ${recruitmentErrors.academicYear ? 'show' : ''}`}>{recruitmentErrors.academicYear}</div>
                    </div>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6 mb-3">
                    <div className="form-floating">
                      <select
                        className={`form-select ${recruitmentErrors.firstChoice ? 'is-invalid' : ''}`}
                        id="firstChoice"
                        value={firstChoice}
                        onChange={(e) => setFirstChoice(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select First Choice</option>
                        {committees.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <label htmlFor="firstChoice">First Choice Committee</label>
                      <div className={`validation-message ${recruitmentErrors.firstChoice ? 'show' : ''}`}>{recruitmentErrors.firstChoice}</div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="form-floating">
                      <select
                        className="form-select"
                        id="secondChoice"
                        value={secondChoice}
                        onChange={(e) => setSecondChoice(e.target.value)}
                      >
                        <option value="">None</option>
                        {committees.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <label htmlFor="secondChoice">Second Choice (Optional)</label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-floating">
                    <textarea
                      className={`form-control ${recruitmentErrors.bio ? 'is-invalid' : ''}`}
                      id="bio"
                      placeholder="Bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      style={{ height: '100px' }}
                      maxLength="1000"
                      required
                    ></textarea>
                    <label htmlFor="bio">About Yourself & Background</label>
                    <div className={`validation-message ${recruitmentErrors.bio ? 'show' : ''}`}>{recruitmentErrors.bio}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-floating">
                    <textarea
                      className="form-control"
                      id="pastExperience"
                      placeholder="Past Experience"
                      value={pastExperience}
                      onChange={(e) => setPastExperience(e.target.value)}
                      style={{ height: '80px' }}
                      maxLength="1000"
                    ></textarea>
                    <label htmlFor="pastExperience">Previous Student Activities (Optional)</label>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-floating">
                    <textarea
                      className={`form-control ${recruitmentErrors.whyJoin ? 'is-invalid' : ''}`}
                      id="whyJoin"
                      placeholder="Why Join"
                      value={whyJoin}
                      onChange={(e) => setWhyJoin(e.target.value)}
                      style={{ height: '80px' }}
                      maxLength="1000"
                      required
                    ></textarea>
                    <label htmlFor="whyJoin">Why do you want to join IEEE?</label>
                    <div className={`validation-message ${recruitmentErrors.whyJoin ? 'show' : ''}`}>{recruitmentErrors.whyJoin}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-floating">
                    <textarea
                      className={`form-control ${recruitmentErrors.whatDoYouKnow ? 'is-invalid' : ''}`}
                      id="whatDoYouKnow"
                      placeholder="What do you know"
                      value={whatDoYouKnow}
                      onChange={(e) => setWhatDoYouKnow(e.target.value)}
                      style={{ height: '80px' }}
                      maxLength="1000"
                      required
                    ></textarea>
                    <label htmlFor="whatDoYouKnow">What do you know about IEEE?</label>
                    <div className={`validation-message ${recruitmentErrors.whatDoYouKnow ? 'show' : ''}`}>{recruitmentErrors.whatDoYouKnow}</div>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <button className="btn btn-ieee btn-ieee-primary btn-ieee-xl" type="submit" disabled={recruitmentLoading}>
                    <span className="btn-text">Submit Application</span>
                    {recruitmentLoading && <span className="btn-spinner d-inline-block"></span>}
                  </button>
                </div>
              </form>

              {recruitmentFeedback.show && (
                <div className={`feedback-panel mt-4 text-center ${recruitmentFeedback.type} show`}>
                  {recruitmentFeedback.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="page-section bg-ieee-light" id="developer">
        <div className="container px-4 px-lg-5">
          <div className="row gx-4 gx-lg-5 justify-content-center">
            <div className="col-lg-8 col-xl-6 text-center reveal">
              <h2 className="mt-0">About the Developer</h2>
              <hr className="divider" />
              <p className="text-muted mb-5">The mind behind the engineering and optimization of this platform.</p>
            </div>
          </div>
          <div className="row gx-4 gx-lg-5 align-items-center justify-content-center">
            <div className="col-lg-8 reveal">
              <div className="developer-card">
                <div className="row align-items-center">
                  <div className="col-md-4 text-center mb-4 mb-md-0">
                    <div className="developer-avatar-container">
                      <img src="/assets/yousef.png" alt="Yousef Ali" className="developer-avatar" />
                    </div>
                  </div>
                  <div className="col-md-8">
                    <h3 className="developer-name">Yousef Ali</h3>
                    <p className="developer-headline">
                      Computer Vision Intern @ NAID | SWE Mentor & Facilitator @ IEEE NU | Junior Teaching Assistant | ASP .NET Developer Enthusiast | ML & NLP Researcher | Student @ Nile University | Google Developer Groups & ITI Certified
                    </p>
                    <div className="mt-4">
                      <Link to="/developer" className="btn btn-ieee btn-ieee-primary" style={{ textDecoration: 'none' }}>
                        <span className="btn-text">View Full Profile</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section contact-section" id="contact">
        <div className="container px-4 px-lg-5">
          <div className="row gx-4 gx-lg-5 justify-content-center">
            <div className="col-lg-8 col-xl-6 text-center reveal">
              <h2 className="mt-0">Let's Get In Touch</h2>
              <hr className="divider" />
              <p className="text-muted mb-5">Have a question or want to collaborate? Send us a message and our team will get back to you as soon as possible.</p>
            </div>
          </div>
          <div className="row gx-4 gx-lg-5 justify-content-center mb-5">
            <div className="col-lg-6 reveal">
              <form id="contactForm" onSubmit={handleContactSubmit} noValidate>
                <div className="form-floating mb-3">
                  <input
                    className="form-control"
                    id="contactName"
                    type="text"
                    placeholder="Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                  <label htmlFor="contactName">Full Name</label>
                </div>
                <div className="form-floating mb-3">
                  <input
                    className="form-control"
                    id="contactEmail"
                    type="email"
                    placeholder="Email Address"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                  <label htmlFor="contactEmail">Email Address</label>
                </div>
                <div className="form-floating mb-3">
                  <input
                    className="form-control"
                    id="contactSubject"
                    type="text"
                    placeholder="Subject"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    required
                  />
                  <label htmlFor="contactSubject">Subject</label>
                </div>
                <div className="form-floating mb-3">
                  <textarea
                    className="form-control"
                    id="contactMessage"
                    placeholder="Message"
                    style={{ height: '10rem' }}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                  ></textarea>
                  <label htmlFor="contactMessage">Message</label>
                </div>
                <div className="d-grid">
                  <button className="btn btn-ieee btn-ieee-primary" type="submit" id="contactSubmitButton" disabled={contactLoading}>
                    <span className="btn-text">Submit Message</span>
                    {contactLoading && <span className="btn-spinner d-inline-block"></span>}
                  </button>
                </div>
              </form>

              {contactFeedback.show && (
                <div className={`feedback-panel feedback-panel-light mt-4 text-center ${contactFeedback.type} show`}>
                  {contactFeedback.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
