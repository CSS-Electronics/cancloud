import React from "react";

function EditorFieldTemplate(props) {
  return (
    <div className="reset-margins">
      <legend>{props.title}</legend>
      <p>{props.schema.description}</p>
      {props.items &&
        props.items.map(element => (
          <div key={element.index}>
            <div className="position-relative">
              <div>
                <div>{element.children}</div>
                <div className="special-array-buttons">
                  {element.hasMoveDown && (
                    <button
                      className="btn btn-default array-item-move-down"
                      onClick={element.onReorderClick(
                        element.index,
                        element.index + 1
                      )}
                    >
                      <i className="glyphicon glyphicon-arrow-down" />
                    </button>
                  )}
                  {element.hasMoveUp && (
                    <button
                      className="btn btn-default array-item-move-up"
                      onClick={element.onReorderClick(
                        element.index,
                        element.index - 1
                      )}
                    >
                      <i className="glyphicon glyphicon-arrow-up" />
                    </button>
                  )}
                  <button
                    className="btn btn-danger array-item-remove"
                    onClick={element.onDropIndexClick(element.index)}
                  >
                    <i className="glyphicon glyphicon-remove" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      {props.canAdd && (
        <div className="add-row-button">
          <p className="col-xs-2 col-xs-offset-10 array-item-add text-right">
            <button
              className="btn btn-info btn-add col-xs-12"
              onClick={props.onAddClick}
              type="button"
            >
              <i className="glyphicon glyphicon-plus" />{" "}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

export default EditorFieldTemplate;
