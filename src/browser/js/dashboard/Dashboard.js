import React from "react";

import SideBar from "../browser/SideBar";
import AlertContainer from "../alert/AlertContainer";
import DashboardMainContent from "./DashboardMainContent";

const Dashboard = () => (
  <div>
    <SideBar />
    <DashboardMainContent />
    <AlertContainer />
  </div>
);

export default Dashboard;
