import React from "react";

import MobileHeader from "../browser/MobileHeader";
import Header from "../browser/Header";
import web from "../web";
import DashboardSection from "./DashboardSection";

const DashboardMainContent = () => (
  <div className="fe-body">
    {web.LoggedIn() && <MobileHeader />}
    <Header />
    <DashboardSection />
  </div>
);

export default DashboardMainContent;
