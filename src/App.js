import './App.css';
import * as d3 from "d3";
import { useState, useEffect, createRef } from "react"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import tip from "d3-tip"

function App() {

  const [mixData, setMixData] = useState() // used to store the average mix date
  const [date, setDate] = useState(new Date()) // used to store the data chosen by the date picker
  const d3Container = createRef(null) // used so d3 can refer to the relevant div

  useEffect(() => {

    fetchData();
    // eslint-disable-next-line
  }, [date])

  // d3
  useEffect(() => {

    // set vars
    const w = 500;
    const h = 500;
    const pad = 40;
    const rad = Math.min(w,h)/2 - pad;

    
    // clear any existing tooltips
    d3.select(".d3-tip").remove()

    // clear any existing svg
    d3.select("svg")
      .remove();

    // add svg to the d3 div
    const svg = d3.select(d3Container.current)
      .append("svg")
      .attr("width",w)
      .attr("height",h)
    .append("g")
      .attr("transform","translate("+ w / 2 + "," + h / 2 +")");

    const color = d3.scaleOrdinal(d3.schemeCategory10)
    
    const pie = d3.pie()
      .value(d => d.value)
    const data_ready = pie(d3.entries(mixData))
    
    const arcGenerator = d3.arc()
      .innerRadius(0)
      .outerRadius(rad)

    const d3tip = tip()
      .attr('class', 'd3-tip')
      .offset([10, 0])
      .html(d => {
        const key = d.data.key
        const val = Math.round(d.data.value*10)/10
        return "<strong>"+key+": </strong>" + val+"%";
  })


    svg.selectAll("slices") // add slices
      .data(data_ready)
      .enter()
      .append("path")
        .attr("d", arcGenerator)
        .attr("fill", d => color(d.data.key))
        .attr("stroke", "black")
      .on("mouseover", d3tip.show)
      .on("mouseout",d3tip.hide)

    svg.call(d3tip)

  // eslint-disable-next-line
  }, [mixData])

  const dateChange = (e) => {
    setDate(e)
    fetchData();
  }

  const fetchData = async () => {
    try {
      const response = await fetch(`https://api.carbonintensity.org.uk/generation/${date.toISOString()}/pt24h`)
      const data = await response.json()

      const mixObj = {
        "biomass": 0,
        "coal": 0,
        "imports": 0,
        "gas": 0,
        "nuclear": 0,
        "other": 0,
        "hydro": 0,
        "solar": 0,
        "wind": 0
      }

      // loop through the results and add to obj so it can be averaged
      data.data.forEach(el => {
        el.generationmix.forEach((mix => {
          mixObj[mix.fuel]+=mix.perc
        }))
      })

      // average
      const avgMix = {}      
      Object.entries(mixObj).forEach(el => {
        avgMix[el[0]]=el[1]/data.data.length
      })

      setMixData({...avgMix})

    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="App">
      <h1>UK Power Generation</h1>
      <h4>Pie chart displaying the proportions of various forms of power generation, averaged across the selected day</h4>
      <div>
        Date: <DatePicker
          minDate={new Date("2018-05-12")}
          maxDate={new Date()}
          placeholderText="Pick a date"
          selected={date}
          onChange={dateChange}
          dateFormat="dd/MM/yyyy"
          showYearDropdown
          showMonthDropdown
          
        />
      </div>
      <div ref={d3Container}>
      </div>
    </div>
  );
}

export default App;
