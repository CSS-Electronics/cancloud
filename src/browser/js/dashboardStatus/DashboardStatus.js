import React from "react";

import SideBar from "../browser/SideBar";
import AlertContainer from "../alert/AlertContainer";
import DashboardStatusMainContent from "./DashboardStatusMainContent";

const DashboardStatus = () => (
  <div>
    <SideBar />
    <DashboardStatusMainContent />
    <AlertContainer />
  </div>
);

export default DashboardStatus;
