import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Footer() {
  const [committees, setCommittees] = useState([]);

  useEffect(() => {
    api.getCommittees()
      .then(data => setCommittees(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <footer className="site-footer">
      <div className="container px-4 px-lg-5">
        <div className="row gx-4 gx-lg-5">
          <div className="col-lg-4 mb-4">
            <h5 className="d-flex align-items-center gap-2 mb-3">
              <img src="/assets/IEEENULogo.jfif" alt="IEEE NU Logo" style={{ height: '30px', borderRadius: '4px' }} />
              <span>IEEE Nile University</span>
            </h5>
            <p className="small" style={{ color: 'rgba(255,255,255,0.5)' }}>
              The IEEE Nile University Student Branch empowers students through hands-on training, technical workshops, and real-world project experience.
            </p>
            <div className="footer-social">
              <a href="https://www.facebook.com/IEEENUSB?mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="https://www.linkedin.com/company/ieee-nile-university-student-branchh/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <i className="bi bi-linkedin"></i>
              </a>
              <a href="https://www.instagram.com/ieeenusb?igsh=MWl6b2dkemRjaGZhOQ==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="bi bi-instagram"></i>
              </a>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 mb-4">
            <h5>Navigate</h5>
            <Link to="/" className="footer-link">Home</Link>
            <Link to="/events" className="footer-link">Events</Link>
            <Link to="/blog" className="footer-link">Blog</Link>
          </div>
          <div className="col-lg-3 col-md-4 mb-4">
            <h5>Committees</h5>
            {committees.length > 0 ? (
              committees.map(c => (
                <span key={c.id} className="footer-link">{c.name}</span>
              ))
            ) : (
              <span className="footer-link">Loading...</span>
            )}
          </div>
          <div className="col-lg-3 col-md-4 mb-4">
            <h5>Contact</h5>
            <a href="mailto:ieee@nu.edu.eg" class="footer-link">
              <i className="bi bi-envelope me-2"></i>ieee@nu.edu.eg
            </a>
            <a href="/#contact" class="footer-link">
              <i className="bi bi-chat-dots me-2"></i>Send a Message
            </a>
            <a href="https://maps.app.goo.gl/PAuhZxfMhvg4sAEZ8" target="_blank" rel="noopener noreferrer" class="footer-link">
              <i className="bi bi-geo-alt me-2"></i>Nile University, Giza
            </a>
          </div>
        </div>
        <div className="footer-bottom text-center">
          <span>Copyright &copy; 2026 IEEE Nile University Student Branch. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
