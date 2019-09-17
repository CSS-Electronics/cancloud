import React from "react";
import { Doughnut  } from "react-chartjs-2";

const DoughnutChart = (props) => {
  const {
    datasets,
    chartColors,
    aspectRatio,
    chHeight
  } = props;

  const time_stamp = datasets[0].label
  const datasetsRestructured = [];

  // restructure the dataset to be suitable for Line/Scatter types
  datasets.map(element =>
    element.data.map(
      (e, i) =>
        (datasetsRestructured[i] = {
          [element.label]: e,
          ...datasetsRestructured[i]
        })
    )
  );

  console.log(datasets)

  console.log(datasetsRestructured)
  
  // borderColor: chartColors[i],
  //     backgroundColor: hexToRgba(chartColors[i], "0.1")

  return (
    <div>
      {datasets ? (
        <Doughnut
          data={{
            datasets: datasets
          }}
          height={chHeight ? chHeight : null}
          options={{
            maintainAspectRatio: aspectRatio
          }}
        />
      ) : null}
    </div>
  );
};

export default DoughnutChart;
