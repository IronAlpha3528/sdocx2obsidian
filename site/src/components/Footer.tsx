import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer" aria-label="Page Footer">
      <div className="content-container">
        <div className="footer-row">
          <ul className="footer-links">
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
                Report an Issue
              </a>
            </li>
            <li>
              <a
                href="https://github.com/IronAlpha3528/sdocx2obsidian/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                MIT License
              </a>
            </li>
          </ul>

          <span className="footer-disclaimer">
            Unofficial tool. Not affiliated with Samsung Electronics or Obsidian.
          </span>
        </div>
      </div>
    </footer>
  );
};
