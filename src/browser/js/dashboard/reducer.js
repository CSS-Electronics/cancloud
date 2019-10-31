import * as dashboardActions from "./actions";

export default (
  state = {
    widget: []
  },
  action
) => {
  switch (action.type) {
    case dashboardActions.WIDGET_RESULT:
        console.log(action.record)

      return {
        ...state,
        widget: action.record
      };
    default:
      return state;
  }
};
