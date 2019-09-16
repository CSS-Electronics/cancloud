export const ADD_QUEUE = "alertModals/ADD_QUEUE";
export const STOP_QUEUE = "alertModals/STOP_QUEUE";
export const UPDATE_QUEUE = "alertModal/UPDATE_QUEUE";
export const SHOW_ABORT_MODAL = "alertModal/SHOW_ABORT_MODAL";

export const AddQueue = (modal, slug, size, name) => ({
  type: ADD_QUEUE,
  modal,
  slug,
  size,
  name
});

export const stopQueue = slug => ({
  type: STOP_QUEUE,
  slug
});

export const updateQueue = (slug, loaded) => ({
  type: UPDATE_QUEUE,
  slug,
  loaded
});

export const showAbortModal = () => ({
  type: SHOW_ABORT_MODAL,
  show: true
});

export const hideAbortModal = () => ({
  type: SHOW_ABORT_MODAL,
  show: false
});
