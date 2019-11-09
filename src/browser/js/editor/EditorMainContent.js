import React from "react";

import MobileHeader from "../browser/MobileHeader";
import Header from "../browser/Header";
import EditorSection from "./EditorSection";
import web from "../web";
import { pathSlice } from "../utils";
import history from "../history";


class EditorMainContent extends React.Component {
  render() {
    const { bucket, prefix } = pathSlice(history.location.pathname);
    return (
      <div className={"fe-body" + (EDITOR.offline ? " fe-body-offline" : "")}>
        {web.LoggedIn() && <MobileHeader />}
        <Header />
        <EditorSection 
          prefixCrnt={prefix}
        />
      </div>
    );
  }
}

export default EditorMainContent;
