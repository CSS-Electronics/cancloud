import React from "react";

import MobileHeader from "../browser/MobileHeader";
import Header from "../browser/Header";
import web from "../web";
import DashboardStatusSection from "./DashboardStatusSection";

const DashboardStatusMainContent = () => (
  <div className="fe-body">
    {web.LoggedIn() && <MobileHeader />}
    <Header />
    <DashboardStatusSection />
  </div>
);

export default DashboardStatusMainContent;
