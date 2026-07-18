import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNuid, setRegNuid] = useState('');

  const [regLoading, setRegLoading] = useState(false);
  const [regFeedback, setRegFeedback] = useState({ show: false, type: '', message: '' });
  const [regErrors, setRegErrors] = useState({});

  useEffect(() => {
    api.getEvents()
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleRegisterClick = (event) => {
    setSelectedEvent(event);
    setRegFullName('');
    setRegEmail('');
    setRegPhone('');
    setRegNuid('');
    setRegErrors({});
    setRegFeedback({ show: false, type: '', message: '' });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegFeedback({ show: false, type: '', message: '' });
    setRegErrors({});

    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;

    if (!regFullName.trim()) errors.fullName = 'Full name is required.';
    if (!emailRegex.test(regEmail)) errors.email = 'Please enter a valid email address.';
    if (!phoneRegex.test(regPhone)) errors.phone = 'Please enter a valid phone number.';
    if (!regNuid.trim()) errors.nuid = 'ID is required.';

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }

    setRegLoading(true);

    const payload = {
      eventId: selectedEvent.id,
      fullName: regFullName,
      email: regEmail,
      phone: regPhone,
      nuid: regNuid
    };

    try {
      const res = await fetch(`https://ieeenuwebsite-b6bfh8dfg3bqfue6.francecentral-01.azurewebsites.net/api/Events/${selectedEvent.id}/Register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setRegFeedback({
        show: true,
        type: 'success',
        message: 'Registration successful! See you at the event.'
      });
      setRegFullName('');
      setRegEmail('');
      setRegPhone('');
      setRegNuid('');
      setTimeout(() => setSelectedEvent(null), 1500);
    } catch (err) {
      console.error(err);
      setRegFeedback({
        show: true,
        type: 'error',
        message: err.message || 'Failed to submit registration. Please try again.'
      });
    } finally {
      setRegLoading(false);
    }
  };

  const filteredEvents = events.filter(e => {
    const isUpcoming = new Date(e.eventDate) >= new Date();
    if (filter === 'upcoming') return isUpcoming;
    if (filter === 'past') return !isUpcoming;
    return true;
  });

  return (
    <div>
      <section className="page-banner">
        <div className="container px-4 px-lg-5">
          <h1>Events & Workshops</h1>
          <p className="banner-subtitle">Browse our upcoming technical sessions, workshops, and community events. Register to secure your spot.</p>
        </div>
      </section>

      <section className="page-section bg-ieee-light">
        <div className="container px-4 px-lg-5">
          <div className="filter-bar">
            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Events</button>
            <button className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`} onClick={() => setFilter('upcoming')}>Upcoming</button>
            <button className={`filter-btn ${filter === 'past' ? 'active' : ''}`} onClick={() => setFilter('past')}>Past</button>
          </div>

          <div className="row gx-4 gx-lg-5">
            {loading ? (
              <>
                <div className="col-lg-4 col-md-6 mb-4"><div className="skeleton skeleton-card" style={{ height: '380px' }}></div></div>
                <div className="col-lg-4 col-md-6 mb-4"><div className="skeleton skeleton-card" style={{ height: '380px' }}></div></div>
                <div className="col-lg-4 col-md-6 mb-4"><div className="skeleton skeleton-card" style={{ height: '380px' }}></div></div>
              </>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map(e => {
                const date = new Date(e.eventDate);
                const isUpcoming = date >= new Date();
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={e.id} className="col-lg-4 col-md-6 mb-4">
                    <div className="event-hub-card">
                      <div className="event-image">
                        {e.imageUrl ? (
                          <img src={e.imageUrl} alt={e.title} />
                        ) : (
                          <div className="event-icon-placeholder">
                            <i className="bi bi-calendar-event"></i>
                          </div>
                        )}
                        <span className="event-date-badge">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="event-body">
                        <div className="mb-2">
                          <span className={`event-status-badge ${isUpcoming ? 'upcoming' : 'past'}`}>
                            {isUpcoming ? 'Upcoming' : 'Past'}
                          </span>
                        </div>
                        <h3>{e.title}</h3>
                        <div className="event-meta">
                          <div><i className="bi bi-geo-alt"></i> {e.location}</div>
                          <div><i className="bi bi-calendar3"></i> {dateStr}</div>
                          {e.maxAttendees > 0 && <div><i className="bi bi-people"></i> Max Attendees: {e.maxAttendees}</div>}
                        </div>
                        <p>{e.description}</p>
                      </div>
                      {isUpcoming && (
                        <div className="event-footer">
                          <button className="btn btn-ieee btn-ieee-primary w-100" onClick={() => handleRegisterClick(e)}>Register Now</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-12 text-center text-muted">
                <p>No events found for this filter.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedEvent && (
        <>
          <div className="modal fade show d-block modal-ieee" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Register for Event</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedEvent(null)} aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    Event: {selectedEvent.title}
                  </p>
                  <form onSubmit={handleRegisterSubmit} noValidate>
                    <div className="form-floating mb-3">
                      <input
                        type="text"
                        className={`form-control ${regErrors.fullName ? 'is-invalid' : ''}`}
                        id="regFullName"
                        placeholder="Full Name"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        maxLength="150"
                        required
                      />
                      <label htmlFor="regFullName">Full Name</label>
                      <div className="validation-message show">{regErrors.fullName}</div>
                    </div>
                    <div className="form-floating mb-3">
                      <input
                        type="email"
                        className={`form-control ${regErrors.email ? 'is-invalid' : ''}`}
                        id="regEmail"
                        placeholder="Email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        maxLength="100"
                        required
                      />
                      <label htmlFor="regEmail">University / Personal Email</label>
                      <div className="validation-message show">{regErrors.email}</div>
                    </div>
                    <div className="form-floating mb-3">
                      <input
                        type="tel"
                        className={`form-control ${regErrors.phone ? 'is-invalid' : ''}`}
                        id="regPhone"
                        placeholder="Phone"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        maxLength="20"
                        required
                      />
                      <label htmlFor="regPhone">Phone Number</label>
                      <div className="validation-message show">{regErrors.phone}</div>
                    </div>
                    <div className="form-floating mb-3">
                      <input
                        type="text"
                        className={`form-control ${regErrors.nuid ? 'is-invalid' : ''}`}
                        id="regNUID"
                        placeholder="NU ID"
                        value={regNuid}
                        onChange={(e) => setRegNuid(e.target.value)}
                        maxLength="50"
                        required
                      />
                      <label htmlFor="regNUID">NU ID (or National ID)</label>
                      <div className="validation-message show">{regErrors.nuid}</div>
                    </div>
                    <div className="modal-footer px-0 pb-0">
                      <button type="button" className="btn btn-ieee btn-ieee-outline" onClick={() => setSelectedEvent(null)}>Cancel</button>
                      <button type="submit" className="btn btn-ieee btn-ieee-primary" disabled={regLoading}>
                        <span className="btn-text">Register</span>
                        {regLoading && <span className="btn-spinner d-inline-block"></span>}
                      </button>
                    </div>
                  </form>
                  {regFeedback.show && (
                    <div className={`feedback-panel mt-3 text-center ${regFeedback.type} show`}>
                      {regFeedback.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
