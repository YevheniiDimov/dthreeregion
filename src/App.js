import './App.css';
import { useEffect, useState } from 'react';
import Treemap from './components/Treemap';

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;
const options = ["avgm", "minm", "maxm", "cntslots"]
let token = null;


function App() {
  const [tree, setTree] = useState(null);
  const [screenSize, setScreenSize] = useState([window.innerWidth - 5, window.innerHeight - 75]);
  const [selectedOption, setSelectedOption] = useState("avgm");

  let updateTree = () => {
    let myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    let formdata = new FormData();

    let requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: formdata,
      redirect: 'follow'
    };

    fetch("https://idmvs.ugis.org.ua/api/dboard/get/regions", requestOptions)
    .then(response => response.json())
    .then(async result => {
        let temp = JSON.parse(result).rows.filter(region => region.id_region !== 24);
        let offices_promises = [];

        for (let i = 0; i < temp.length; i++) {
          let myHeaders = new Headers();
          myHeaders.append("Authorization", token);

          let formdata = new FormData();
          formdata.append("id_region", temp[i].id_region);

          let requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: formdata,
            redirect: 'follow'
          };

          let p = new Promise(async (resolve, reject) => {
            await fetch("https://idmvs.ugis.org.ua/api/dboard/get/offices", requestOptions)
            .then(response => response.json())
            .then(offices => {
              temp[i].children = JSON.parse(offices).rows;
              resolve(0);
            })
            .catch(error => reject(error));
          });

          offices_promises.push(p);
        }

        Promise.all(offices_promises).then(values => {
          console.log('Values: ' + JSON.stringify(values));
          console.log(JSON.stringify(temp));
          setTree(temp.filter(r => r.children));
          //console.log('Received tree: ' + tree);
        })
    });
  }
  
  let updateToken = () => {
    let formdata = new FormData();
    formdata.append("grant_type", "client_credentials");
    formdata.append("client_secret", CLIENT_SECRET);
    formdata.append("client_id", CLIENT_ID);
    formdata.append("scope", "basic");
    formdata.append("state", "treemap1");

    let requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow',
      mode: "cors"
    };

    fetch("https://idmvs.ugis.org.ua/token/", requestOptions)
    .then(response => response.json())
    .then(result => {
        token = `${result.token_type} ${result.access_token}`;
        //console.log('Authorized result');
        //console.log(result);
        //console.log('Authorized token: ' + token);
        updateTree();
    });
  }

  useEffect(() => {
    if (token == null) {
      updateToken();
    }
  });

  console.log('Update2010: 0.8.5.6');

  window.addEventListener("resize", () => {
    //console.log("Screen Size change");
    setScreenSize([window.innerWidth - 10, window.innerHeight - 75]);
  });

  return (
    <div className="App">
      { tree != null ?
      <div id="treemap-box">
        <Treemap width={screenSize[0]} height={screenSize[1]} data={tree} token={token} selectedOption={selectedOption} />
        <select className="form-select my-2" value={selectedOption} onChange={e => setSelectedOption(e.target.value)}>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      : <h1>Завантаження даних...</h1>}
    </div>
  );
}

export default App;