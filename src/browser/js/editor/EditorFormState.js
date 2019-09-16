import React, { Component } from "react";

class EditorFormState extends Component {
  constructor(props) {
    super(props);
    this.state = { valid: true, code: props.code };
  }

  componentWillReceiveProps(props) {
    this.setState({ code: props.code }, () => {
      // this.props.onChange(JSON.stringify(props.code));
    });
  }

  render() {
    return null;
  }
}

export default EditorFormState;
