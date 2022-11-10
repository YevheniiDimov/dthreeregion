import * as d3 from 'd3';
import React, { useRef, useEffect, useState } from 'react';
import OfficePopup from './OfficePopup';
import { LegendThreshold } from '@vx/legend';

const color = d3.scaleThreshold()
    .domain([0, 2, 4, 6, 8])
    .range(["#30CC5A", "#2F9E4F", "#35764E", "#8B444E", "#BF4045", "#F63538"]);

const colorHundred = d3.scaleThreshold()
    .domain([95, 100])
    .range(["#046381", "#30CC5A", "#F63538"]);

function mouseTooltip(d, officeHandler, setSelectedOfficeHandler) {
	let x = d3.event.pageX - document.getElementById("treemap-svg").getBoundingClientRect().x + 10;
  let y = d3.event.pageY - document.getElementById("treemap-svg").getBoundingClientRect().y + 10;

  console.log('Data click');
  console.log(d);
  if (!d.data.value) {
    officeHandler([null, [x, y]]);
    setSelectedOfficeHandler(null);
  }
  else {
    officeHandler([d.data, [x, y]]);
    setSelectedOfficeHandler(d.data);
  }
}

function retrieveValues(data, token, setReceivedCallback, setMessageCallback) {
  var myHeaders = new Headers();
  myHeaders.append("Authorization", token);

  var formdata = new FormData();

  var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: formdata,
      redirect: 'follow'
  };
  fetch("https://idmvs.ugis.org.ua/api/dboard/get/statdeltastart", requestOptions)
    .then(response => response.json())
    .then(async result => {
      if (data != null) {
        let offices = JSON.parse(result).rows;

        if (!offices) {
          throw new Error("Помилка: Дані офісів наразі недоступні. Скоріше за все жоден офіс не працює.");
        }

        for (let region of data) {
          for (let office of region.children) {
            let office_values = offices.find(o => o.office_id === office.id_offices);
            if (office_values !== undefined) {
              office.value = office_values.avgm;
              office.cntslots = office_values.cntslots;
              office.minm = office_values.minm;
              office.maxm = office_values.maxm;
            }
          }
        }

        setReceivedCallback(true);
        console.log('Successfully retrieved office values, Data:');
        console.log(data);
      }
      else {
        throw new Error("Помилка: дані ще не отримані");
      }
    })
    .catch(error => {
      console.log('Values Error: ' + error);
      setMessageCallback(error.message);
    });
}

function Treemap({ width, height, data, token, selectedOption, setSelectedOfficeHandler}) {
    const [receivedValues, setReceivedValues] = useState(false);
    const [message, setMessage] = useState("Отримання значень...");
    const [selectedOffice, setSelectedOffice] = useState([null, [0, 0]]);
    const ref = useRef();
    
    const draw = () => {
      const svg = d3.select(ref.current);
      svg.selectAll("*").remove();
      svg
        .attr('width', width).attr('height', height)

      let hierarchy = {'children': data};

      // Give the data to this cluster layout:
      var root = d3.hierarchy(hierarchy).sum(d => d.size);
  
      // initialize treemap
      d3.treemap()
          .size([width, height])
          .paddingTop(24)
          .paddingLeft(1)
          .paddingRight(1)
          .paddingInner(2)
          (root);

      // Select the nodes
      var nodes = svg
        .selectAll("g")
        .data(root.leaves());

      // draw rectangles
      nodes.enter()
          .append("rect")
          .attr('x', d => d.x0)
          .attr('y', d => d.y0)
          .attr('width', d => d.x1 - d.x0)
          .attr('height', d => d.y1 - d.y0)
          .style("fill", d => {
            if (selectedOption === "accuracy") {
              return color(d.data.value);
            }

            console.log(`Selected ${selectedOption} option`);
            console.log(d.data);
            return colorHundred(d.data[selectedOption]);
          });

      nodes.exit().remove()
      
      // select node titles
      var nodeVals = svg
          .selectAll("vals")
          .data(root.leaves())  

      // add the values
      nodeVals.enter()
          .append("text")
            .attr("x", d => (d.x0 + d.x1)/2 - 15)
            .attr("y", d => (d.y0 + d.y1)/2 + 5)
            .text(d => d.data.size < 5 ? "" : d.data.offices_n)
            .attr("font-size", "12px")
            .attr("class", "unselectable")
            .attr("fill", "white")
  
      // add the parent node titles
      svg
      .selectAll("titles")
      .data(root.descendants().filter(d => d.depth === 1))
      .enter()
      .append("text")
          .attr("x", d => d.x0)
          .attr("y", d => d.y0 + 20)
          .text(d => d.data.region_name)
          .attr("font-size", "12px")
          .attr();
      
      svg
      .selectAll("*")
        .on("click", d => mouseTooltip(d, setSelectedOffice, setSelectedOfficeHandler));

      d3.select("body")
        .on("keydown", () => mouseTooltip({data: {}}, setSelectedOffice, setSelectedOfficeHandler));
  }

  useEffect(() => {
    if (receivedValues) {
      draw();
    }
  });

  console.log('Retrieving values... (First)');
  retrieveValues(data, token, setReceivedValues, setMessage);

  setInterval(() => {
    console.log('Retrieving values...');
    setReceivedValues(false);
    retrieveValues(data, token, setReceivedValues, setMessage);
  }, 6E5); // Ten minutes

  document.getElementById("body").addEventListener("keypress", ev => {
    if (ev.key === 'Escape') {
      mouseTooltip(null, setSelectedOffice, setSelectedOfficeHandler);
    }
  });

  return (
      <div>
        { receivedValues 
        ? <div>
            <svg ref={ref} id={"treemap-svg"}/>
            { selectedOption == 'accuracy' ?
              <LegendThreshold
              scale={color}
              direction="row"
              itemDirection="column"
              labelMargin="-22px 0 0 0"
              labelAlign="center"
              labelLower='Менш ніж '
              labelUpper='Більш ніж '
              labelDelimiter='до'
              shapeHeight="25px"
              shapeWidth="100px"
            />
            :
            <LegendThreshold
              scale={colorHundred}
              direction="row"
              itemDirection="column"
              labelMargin="-22px 0 0 0"
              labelAlign="center"
              labelLower='Менш ніж '
              labelUpper='Більш ніж '
              labelDelimiter='до'
              shapeHeight="25px"
              shapeWidth="100px"
            />
            }
            </div>
        : <h1>{message}</h1>
        }
        { selectedOffice[0] != null
          ? <OfficePopup mousePosition={selectedOffice[1]} 
                         office_data={selectedOffice[0]}
                         token={token}
                         setMessageCallback={setMessage}></OfficePopup>
          : <div></div>
        }
      </div>
    )
}

export default Treemap;