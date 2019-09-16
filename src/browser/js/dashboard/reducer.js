import * as dashboardActions from "./actions";

export default (
  state = {
    widget: []
  },
  action
) => {
  switch (action.type) {
    case dashboardActions.WIDGET_RESULT:
      return {
        ...state,
        widget: action.record
      };
    default:
      return state;
  }
};
