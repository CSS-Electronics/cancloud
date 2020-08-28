import React from "react";

class EditorToolModalWrapper extends React.Component{
  constructor(props) {
    super(props);
  }

  render(){
    return (
      <div className="tools-side-bar">
        <button type="button" className="close" onClick={this.props.onClick}>
          <span style={{ color: "gray" }}>×</span>
        </button>
        {this.props.modal}
    
      </div>
    )
  }
}

export default EditorToolModalWrapper