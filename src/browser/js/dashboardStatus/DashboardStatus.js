import React from "react";

import SideBar from "../browser/SideBar";
import AlertContainer from "../alert/AlertContainer";
import DashboardStatusMainContent from "./DashboardStatusMainContent";
import DeviceFileModal from "../browser/DeviceFileModal"

const DashboardStatus = () => (
  <div>
    <SideBar />
    <DeviceFileModal/>
    <DashboardStatusMainContent />
    <AlertContainer />
  </div>
);

export default DashboardStatus;
