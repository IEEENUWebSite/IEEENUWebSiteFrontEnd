import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, saveSession } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, type: '', message: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (getToken()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ show: false, type: '', message: '' });
    setErrors({});

    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const data = await api.login(email.trim(), password);
      if (data.token) {
        saveSession(data.token, data.member || null);
        navigate('/dashboard');
      } else {
        setFeedback({
          show: true,
          type: 'error',
          message: 'Invalid email or password. Please try again.'
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        show: true,
        type: 'error',
        message: err.message || 'Unable to connect to the server. Please check your connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon">
            <i className="bi bi-shield-lock"></i>
          </div>
          <h1>Member Portal</h1>
          <p>IEEE Nile University Student Branch</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-floating mb-3">
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              id="loginEmail"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="loginEmail">Email Address</label>
            <div className="validation-message show">{errors.email}</div>
          </div>

          <div className="form-floating mb-4">
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              id="loginPassword"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label htmlFor="loginPassword">Password</label>
            <div className="validation-message show">{errors.password}</div>
          </div>

          <button className="btn btn-ieee btn-ieee-primary w-100" type="submit" disabled={loading}>
            <span className="btn-text">Sign In</span>
            {loading && <span className="btn-spinner d-inline-block"></span>}
          </button>
        </form>

        {feedback.show && (
          <div className={`feedback-panel mt-4 text-center ${feedback.type} show`}>
            {feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}
