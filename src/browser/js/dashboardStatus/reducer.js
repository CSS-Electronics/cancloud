import * as dashboardStatusActions from "./actions";

export default (
  state = {
    objectsData: {},
    deviceFileContents: [],
    deviceFileObjects: []
  },
  action
) => {
  switch (action.type) {
    case dashboardStatusActions.OBJECTS_RESULT:
      return {
        ...state,
        objectsData: action.objectsData
      };
    case dashboardStatusActions.DEVICE_FILE_CONTENT:
      return {
        ...state,
        deviceFileContents: action.deviceFileContents
      };
    case dashboardStatusActions.SET_DEVICE_FILE_OBJECT:
      return {
        ...state,
        deviceFileObjects: action.deviceFileObjects
      };
    default:
      return state;
  }
};
