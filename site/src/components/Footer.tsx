import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer" aria-label="Page Footer">
      <div className="content-container">
        <div className="footer-row">
          <ul className="footer-links">
            <li>
              <Link to="/faq" className="footer-link">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="footer-link">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/about" className="footer-link">
                About
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/IronAlpha3528/sdocx2obsidian"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href="https://github.com/IronAlpha3528/sdocx2obsidian/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                Issues
              </a>
            </li>
          </ul>

          <span className="footer-disclaimer">
            MIT License · Unofficial tool unaffiliated with Samsung Electronics or Obsidian.
          </span>
        </div>
      </div>
    </footer>
  );
};
