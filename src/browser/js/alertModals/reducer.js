import * as actionAlertModals from "./actions";

const add = (files, action) => ({
  ...files,
  [action.slug]: {
    loaded: 0,
    size: action.size,
    name: action.name
  }
});

const stop = (files, action) => {
  const newFiles = Object.assign({}, files);
  delete newFiles[action.slug];
  return {};
};

const update = (files, action) => ({
  ...files,
  [action.slug]: {
    ...files[action.slug],
    loaded: action.loaded
  }
});

export default (
  state = {
    files: {},
    showAbortModal: false
  },
  action
) => {
  switch (action.type) {
    case actionAlertModals.ADD_QUEUE:
      return {
        ...state,
        files: add(state.files, action),
        modal: action.modal
      };
    case actionAlertModals.STOP_QUEUE:
      return {
        ...state,
        files: stop(state.files, action)
      };
    case actionAlertModals.UPDATE_QUEUE:
      return {
        ...state,
        files: update(state.files, action)
      };
    case actionAlertModals.SHOW_ABORT_MODAL:
      return {
        ...state,
        showAbortModal: action.show
      };
    default:
      return state;
  }
};
