import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const scrolled = (window.scrollY / totalScroll) * 100;
        setScrollProgress(scrolled);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.getBlogPosts()
      .then(data => {
        const found = data.find(p => p.id === parseInt(id, 10));
        setPost(found);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post ? post.title : '');
    let shareUrl = '';

    if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    } else if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="container py-5 mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="skeleton skeleton-card" style={{ height: '350px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-5 mt-5 text-center">
        <h2>Post Not Found</h2>
        <p>The post you are looking for does not exist or has been deleted.</p>
        <Link to="/blog" className="btn btn-ieee btn-ieee-primary">Back to Blog</Link>
      </div>
    );
  }

  const dateStr = new Date(post.publishedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const authorName = post.author ? post.author.fullName : 'Unknown';
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <div>
      <div className="reading-progress" style={{ width: `${scrollProgress}%` }}></div>

      <section className="page-section bg-ieee-light mt-5">
        <div className="container px-4 px-lg-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <Link to="/blog" className="back-link">
                <i className="bi bi-arrow-left"></i> Back to Blog
              </Link>

              <article className="article-content">
                <header className="article-header">
                  <h1>{post.title}</h1>
                  <div className="article-meta">
                    <div className="author-badge">
                      {post.author && post.author.profilePictureUrl ? (
                        <img src={post.author.profilePictureUrl} alt={authorName} className="author-avatar" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="author-avatar">{authorInitial}</div>
                      )}
                      <span>{authorName}</span>
                    </div>
                    <span>{dateStr}</span>
                  </div>
                </header>

                {post.imageUrl && (
                  <img src={post.imageUrl} alt={post.title} className="article-feature-image" />
                )}

                <div className="article-body">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
                </div>

                <footer className="share-bar">
                  <span className="share-label">Share:</span>
                  <button className="share-btn" onClick={() => handleShare('facebook')} aria-label="Share on Facebook">
                    <i className="bi bi-facebook"></i>
                  </button>
                  <button className="share-btn" onClick={() => handleShare('twitter')} aria-label="Share on Twitter">
                    <i className="bi bi-twitter-x"></i>
                  </button>
                  <button className="share-btn" onClick={() => handleShare('linkedin')} aria-label="Share on LinkedIn">
                    <i className="bi bi-linkedin"></i>
                  </button>
                </footer>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
