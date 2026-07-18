import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  useEffect(() => {
    api.getBlogPosts()
      .then(data => {
        setPosts(data.filter(p => p.isPublished));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const tags = ['all', 'Technology', 'Student Activities', 'Announcements'];

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = selectedTag === 'all' || 
                       (p.content.toLowerCase().includes(selectedTag.toLowerCase()) || p.title.toLowerCase().includes(selectedTag.toLowerCase()));

    return matchesSearch && matchesTag;
  });

  return (
    <div>
      <section className="page-banner">
        <div className="container px-4 px-lg-5">
          <h1>IEEE NU Blog</h1>
          <p className="banner-subtitle">Stay updated with our technical insights, student stories, and latest branch announcements.</p>
        </div>
      </section>

      <section className="page-section bg-ieee-light">
        <div className="container px-4 px-lg-5">
          <div className="row gx-4 gx-lg-5">
            <div className="col-lg-8">
              <div className="row">
                {loading ? (
                  <>
                    {[1, 2].map(n => (
                      <div key={n} className="col-md-6 mb-4">
                        <div className="blog-card">
                          <div className="blog-image skeleton" style={{ height: '180px' }}></div>
                          <div className="blog-body" style={{ minHeight: '180px' }}>
                            <div className="skeleton skeleton-text short mb-2"></div>
                            <div className="skeleton skeleton-text medium mb-3" style={{ height: '1.25rem' }}></div>
                            <div className="skeleton skeleton-text long mb-2"></div>
                            <div className="skeleton skeleton-text medium mb-3"></div>
                            <div className="skeleton skeleton-button mt-auto" style={{ width: '80px', height: '1.25rem' }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map(p => {
                    const dateStr = new Date(p.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const authorName = p.author ? p.author.fullName : 'Unknown';
                    const cleanContent = p.content.replace(/<[^>]*>/g, '');
                    const excerpt = cleanContent.length > 100 ? cleanContent.substring(0, 100) + '...' : cleanContent;

                    return (
                      <div key={p.id} className="col-md-6 mb-4">
                        <div className="blog-card">
                          <div className="blog-image">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.title} />
                            ) : (
                              <div className="blog-icon-placeholder">
                                <i className="bi bi-journal-text"></i>
                              </div>
                            )}
                          </div>
                          <div className="blog-body">
                            <div className="blog-meta">
                              By <span className="author-name">{authorName}</span> on {dateStr}
                            </div>
                            <h3>{p.title}</h3>
                            <p className="blog-excerpt">{excerpt}</p>
                            <div className="mt-auto">
                              <Link to={`/blog/${p.id}`} className="read-more-link">Read More</Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-12 text-center text-muted">
                    <p>No blog posts found.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-4 blog-sidebar">
              <div className="sidebar-card">
                <h4>Search Posts</h4>
                <div className="sidebar-search">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i className="bi bi-search search-icon"></i>
                </div>
              </div>

              <div className="sidebar-card">
                <h4>Tags</h4>
                <div className="d-flex flex-wrap gap-1">
                  {tags.map(tag => (
                    <button
                      key={tag}
                      className={`tag-btn ${selectedTag === tag ? 'active' : ''}`}
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sidebar-card newsletter-card">
                <h4>Newsletter</h4>
                <p>Subscribe to our newsletter to receive the latest updates directly in your inbox.</p>
                <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }} noValidate>
                  <div className="mb-3">
                    <input type="email" className="form-control" placeholder="Your Email Address" required />
                  </div>
                  <button className="btn btn-ieee btn-ieee-primary w-100" type="submit">Subscribe</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
