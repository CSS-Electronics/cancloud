import React from "react";
import { GENERIC_NAV } from "react-jsonschema-form-pagination/lib/utils";

function EditorNavs({ navs: { links }, onNavChange }) {
  let relLinks = links.filter(({ nav }) => nav !== GENERIC_NAV);
  return (
    <nav className="navbar navbar-default navbar-margin-reduce">
      <div className="container-fluid">
        <div className="collapse navbar-collapse">
          <ul className="nav navbar-nav navbar-ul-margin-reduce">
            {relLinks.map(({ nav, name, icon, isActive }, i) => (
              <li
                key={i}
                onClick={() => onNavChange(nav)}
                className={isActive ? "active bottom-border" : null}
              >
                <a className={isActive ? "nav-active" : null}>
                  {icon && <span className={icon} aria-hidden="true" />}
                  &nbsp;{name || nav}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default EditorNavs;
