import React, { useState } from 'react';

function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email.includes('@')) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer style={{
      background: '#0a1f12',
      color: '#e2f0e8',
      padding: '56px 0 0',
      marginTop: '40px',
      borderRadius: '16px 16px 0 0'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px' }}>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '48px'
        }}>

          {/*  Infos société */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{
                width: '36px', height: '36px',
                background: '#00c37a', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="fa-solid fa-droplet" style={{ color: '#0a1f12', fontSize: '16px' }}></i>
              </div>
              <span style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                Smart<span style={{ color: '#00c37a' }}>Irrig</span>
              </span>
            </div>

            <p style={{ fontSize: '13px', color: '#7a9e8a', lineHeight: '1.7', marginBottom: '18px' }}>
              Système intelligent de prédiction d'irrigation basé sur l'IA et les capteurs IoT pour une agriculture optimisée.
            </p>

            {/* email  */}
            <div style={{
              display: 'flex', alignItems: 'flex-start',
              gap: '10px', marginBottom: '10px',
              fontSize: '13px', color: '#9ab5a4'
            }}>
              <i className="fa-solid fa-envelope" style={{ color: '#00c37a', marginTop: '3px', width: '14px' }}></i>
              <span>YZ.support@gmail.com</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div style={{
              fontSize: '11px', fontWeight: '600', color: '#00c37a',
              textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '18px'
            }}>
              Navigation
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/*  Produits et Dashboard */}
              {['Accueil', 'À propos', 'Contact', 'FAQ'].map((link, i) => (
                <li key={i}>
                  <a href="#" style={{
                    fontSize: '13px', color: '#7a9e8a',
                    textDecoration: 'none', display: 'flex',
                    alignItems: 'center', gap: '8px',
                    transition: 'color 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#00c37a'}
                    onMouseLeave={e => e.currentTarget.style.color = '#7a9e8a'}
                  >
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: '9px', color: '#1e4d2e' }}></i>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* À propos (remplace Produits) */}
          <div>
            <div style={{
              fontSize: '11px', fontWeight: '600', color: '#00c37a',
              textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '18px'
            }}>
              À propos
            </div>
            <p style={{ fontSize: '13px', color: '#7a9e8a', lineHeight: '1.8' }}>
              SmartIrrig est un projet MLOps académique développé par <strong style={{ color: '#e2f0e8' }}>Youssef & Zaidane</strong>.
              Il combine l'intelligence artificielle, les capteurs IoT et les pratiques DevOps modernes pour automatiser
              l'irrigation agricole et optimiser la consommation d'eau en serre.
            </p>
          </div>

          {/*  FAQ + Newsletter */}
          <div>
            {/* FAQ */}
            <div style={{
              fontSize: '11px', fontWeight: '600', color: '#00c37a',
              textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '14px'
            }}>
              FAQ
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Comment fonctionne la prédiction ?',
                'Quels capteurs sont supportés ?',
                'Comment accéder à l\'API ?',
                'Comment interpréter les résultats ?',
              ].map((q, i) => (
                <li key={i}>
                  <a href="#" style={{
                    fontSize: '13px', color: '#7a9e8a',
                    textDecoration: 'none', display: 'flex',
                    alignItems: 'flex-start', gap: '8px',
                    transition: 'color 0.2s', lineHeight: '1.5'
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#00c37a'}
                    onMouseLeave={e => e.currentTarget.style.color = '#7a9e8a'}
                  >
                    <i className="fa-solid fa-circle-question"
                       style={{ fontSize: '12px', color: '#1e4d2e', marginTop: '3px', flexShrink: 0 }}></i>
                    {q}
                  </a>
                </li>
              ))}
            </ul>

            {/* Newsletter */}
            <div style={{
              fontSize: '11px', fontWeight: '600', color: '#00c37a',
              textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px'
            }}>
              Newsletter
            </div>
            <div style={{
              display: 'flex', borderRadius: '8px',
              overflow: 'hidden', border: '1px solid #1e4d2e',
              marginBottom: '16px'
            }}>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSubscribe()}
                style={{
                  flex: 1, background: '#0d2a18',
                  border: 'none', padding: '10px 14px',
                  fontSize: '13px', color: '#e2f0e8', outline: 'none'
                }}
              />
              <button onClick={handleSubscribe} style={{
                background: '#00c37a', border: 'none',
                padding: '10px 14px', color: '#0a1f12',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer'
              }}>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>

            {subscribed && (
              <p style={{ fontSize: '12px', color: '#00c37a', marginBottom: '12px' }}>
                <i className="fa-solid fa-circle-check"></i> Merci pour votre inscription !
              </p>
            )}

            {/* Réseaux sociaux */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { icon: 'fa-facebook-f',  label: 'Facebook' },
                { icon: 'fa-linkedin-in', label: 'LinkedIn' },
                { icon: 'fa-instagram',   label: 'Instagram' },
                { icon: 'fa-x-twitter',   label: 'Twitter' },
              ].map((social, i) => (
                <button key={i} title={social.label} style={{
                  width: '36px', height: '36px',
                  borderRadius: '8px', background: '#0d2a18',
                  border: '1px solid #1e4d2e',
                  color: '#7a9e8a', cursor: 'pointer',
                  fontSize: '14px', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#00c37a';
                    e.currentTarget.style.color = '#0a1f12';
                    e.currentTarget.style.borderColor = '#00c37a';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#0d2a18';
                    e.currentTarget.style.color = '#7a9e8a';
                    e.currentTarget.style.borderColor = '#1e4d2e';
                  }}
                >
                  <i className={`fa-brands ${social.icon}`}></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/*  Barre du bas avec  copyright */}
      <div style={{
        borderTop: '1px solid #1a3a24',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <span style={{ fontSize: '12px', color: '#4a7a5a', textAlign: 'center' }}>
          © 2026 SmartIrrig. Tous droits réservés par{' '}
          <strong style={{ color: '#00c37a' }}>Youssef & Zaidane</strong>
        </span>

        <span style={{ color: '#1e4d2e' }}>·</span>

        {[
          { label: 'Politique de confidentialité', href: 'http://192.168.3.32:3000/#' },
          { label: "Conditions d'utilisation",     href: 'http://192.168.3.32:3000/#' },
        ].map((link, i) => (
          <a key={i} href={link.href} style={{
            fontSize: '12px', color: '#4a7a5a',
            textDecoration: 'none', transition: 'color 0.2s'
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#00c37a'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a7a5a'}
          >
            {link.label}
          </a>
        ))}

        <span style={{ color: '#1e4d2e' }}>·</span>

        <span style={{
          fontSize: '11px', color: '#00c37a',
          background: '#0d2a18', border: '1px solid #1e4d2e',
          borderRadius: '20px', padding: '3px 10px',
          display: 'flex', alignItems: 'center', gap: '5px'
        }}>
          <i className="fa-solid fa-microchip" style={{ fontSize: '10px' }}></i>
          MLOps powered
        </span>
      </div>
    </footer>
  );
}

export default Footer;