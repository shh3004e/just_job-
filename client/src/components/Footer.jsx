import React from 'react';
import { Mail, ShieldCheck, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#1d2226',
      color: '#ffffff',
      padding: '40px 0 20px 0',
      marginTop: '60px',
      borderTop: '3px solid var(--accent)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* Brand Info */}
          <div>
            <h3 style={{
              fontFamily: 'var(--font-family-display)',
              color: '#ffffff',
              fontSize: '22px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ color: 'var(--accent-light)' }}>JJ</span> Just Job
            </h3>
            <p style={{ color: '#c7d2fe', opacity: 0.8, fontSize: '14px', maxWidth: '300px' }}>
              The exclusive job board designed for fresher Graphic Designers and UI/UX Designers to connect directly with Hiring Managers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '16px', color: 'var(--accent-light)', marginBottom: '16px' }}>Platform Highlights</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#e4e6eb' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent-light)' }} />
                Fresher Specific (0-12 months only)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent-light)' }} />
                AI Tools Integration Required
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent-light)' }} />
                Verified Recruiter Pipelines
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '16px', color: 'var(--accent-light)', marginBottom: '16px' }}>Get In Touch</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#e4e6eb' }}>
              <a href="mailto:support@jjjustjob.com" style={{ color: '#e4e6eb', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} style={{ color: 'var(--accent-light)' }} />
                support@jjjustjob.com
              </a>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <a href="https://v0-suryansh-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer" style={{
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Globe size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '20px 0' }} />

        {/* Developed by Suryansh watermark */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '13px',
          color: '#8c8c8c'
        }}>
          <p>© {new Date().getFullYear()} JJ Just Job. All rights reserved.</p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#e4e6eb',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            Developed by 
            <a href="https://v0-suryansh-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer" style={{
              color: 'var(--accent-light)',
              textDecoration: 'underline',
              fontWeight: '700'
            }}>
              Suryansh
            </a> 
            <span>(founder)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
