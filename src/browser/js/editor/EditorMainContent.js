import React from "react";

import MobileHeader from "../browser/MobileHeader";
import Header from "../browser/Header";
import EditorSection from "./EditorSection";
import web from "../web";

class EditorMainContent extends React.Component {
  render() {
    return (
      <div className={"fe-body" + (EDITOR.offline ? " fe-body-offline" : "")}>
        {web.LoggedIn() && <MobileHeader />}
        <Header />
        <EditorSection />
      </div>
    );
  }
}

export default EditorMainContent;
