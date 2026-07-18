import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getToken, getMember, clearSession } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(getToken());
  const [member, setMember] = useState(getMember());
  const [isShrunk, setIsShrunk] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsShrunk(true);
      } else {
        setIsShrunk(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setToken(getToken());
    setMember(getMember());
  }, [location]);

  const handleLogout = () => {
    clearSession();
    setToken(null);
    setMember(null);
    navigate('/login');
  };

  const handleHashLink = (hash) => {
    if (location.pathname !== '/') {
      navigate('/' + hash);
    } else {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const isAdmin = member && ['admin', 'board', 'media', 'moderator'].includes((member.role || '').toLowerCase());

  return (
    <nav className={`navbar navbar-expand-lg fixed-top py-3 ${isShrunk || location.pathname !== '/' ? 'navbar-shrink' : ''}`} id="mainNav">
      <div className="container px-4 px-lg-5">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img src="/assets/IEEENULogo.jfif" alt="IEEE NU Logo" style={{ height: '40px', borderRadius: '4px' }} />
          <span>IEEE Nile University</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarResponsive">
          <ul className="navbar-nav ms-auto my-2 my-lg-0">
            <li className="nav-item">
              <button className="nav-link btn btn-link border-0 text-start" onClick={() => handleHashLink('#about')}>About</button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn btn-link border-0 text-start" onClick={() => handleHashLink('#committees')}>Committees</button>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/events' ? 'active' : ''}`} to="/events">Events</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname.startsWith('/blog') ? 'active' : ''}`} to="/blog">Blog</Link>
            </li>
            <li className="nav-item">
              <button className="nav-link btn btn-link border-0 text-start" onClick={() => handleHashLink('#recruitment')}>Recruitment</button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn btn-link border-0 text-start" onClick={() => handleHashLink('#contact')}>Contact</button>
            </li>
            {token ? (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} to="/dashboard">Dashboard</Link>
                </li>
                {isAdmin && (
                  <li className="nav-item">
                    <Link className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} to="/admin">Admin</Link>
                  </li>
                )}
                <li className="nav-item">
                  <button className="nav-link btn btn-link border-0 text-start" onClick={handleLogout}>Logout</button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`} to="/login">Member Portal</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
