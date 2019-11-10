import React from "react";
import Select from "react-select";

const defaultOptions = [{ name: "None" }, { name: "Upload" }];

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#fcfcfc !important",
  })
};

const selectOptions = Files => {
  Files = _.orderBy(Files, ["name"], ["desc"]);
  return [...Files, ...defaultOptions].map(File => ({
    value: File.name,
    label: File.name
  }));
};

class EditorDropDown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      defaultOption: {
        label: "None",
        value: "None"
      }
    };
  }

  componentWillReceiveProps(nextProps) {
     if (nextProps.selected != "") {
      this.setState({
        defaultOption: {
          value: nextProps.selected,
          label: nextProps.selected
        }
      });
    } else {
      this.setState({
        defaultOption: selectOptions(nextProps.options)[0]
      });
    }
  }

  handleSelectChange = selectedValue => {
    if (selectedValue.value === "Upload") {
      this.props.onChange("None");
      this.refs.fileUploader.click();
    } else if (!selectedValue.value.includes("(local)")) {
      this.props.onChange(selectedValue.value);
    }
  };

  componentWillMount(){
    this.setState({
      defaultOption: selectOptions(this.props.options)[0]
    });
  }

  render() {

    let { handleUplodedFile, options } = this.props;

    return (
      <div className="form-group pl0 field-string">
        <p>{this.props.name}</p>
        <Select
          value={this.state.defaultOption}
          options={selectOptions(options)}
          onChange={this.handleSelectChange}
          isSearchable={false}
          styles={this.props.customBackground ? customStyles : {}}
        />
        <input
          type="file"
          accept=".json"
          ref="fileUploader"
          style={{ display: "none" }}
          onChange={e => {
            handleUplodedFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
        <p className="field-description field-description-shift">
          {this.props.comment}
        </p>
      </div>
    );
  }
}

export default EditorDropDown;
