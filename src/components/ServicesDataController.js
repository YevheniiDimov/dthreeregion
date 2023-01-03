import { useState, useEffect } from "react";
import Service from './Service';

function retrieveServices(office_data, token, setServicesHandler) {
    let myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    let requestOptions = {
        method: 'POST',
        headers: myHeaders,
        redirect: 'follow'
    };


    let temp = [];

    fetch("https://idmvs.ugis.org.ua/api/dboard/get/worktime", requestOptions)
    .then(response => response.json())
    .then(result => {
        let total = JSON.parse(result).rows;
        for (let service of total) {
            if (service.office_id === office_data.id_offices) {
                temp.push(service);
            }
        }
        console.log('Services');
        console.log(temp);
        setServicesHandler(temp);
    })
    .catch(error => console.log('error', error));
}

function ServicesDataController({office_data, token}) {
    const [data, setData] = useState(office_data);
    const [services, setServices] = useState([]);
    const [receivedValues, setReceivedValues] = useState(false);

    useEffect(() => {
        if (!receivedValues) {
            retrieveServices(data, token, setServices);
        }
    }, [data]);

    return (
        <div>
            { services ? <Service office={office_data} services={services} /> 
            : <div>
                <div className="spinner-border text-dark mt-5" role="status" />
                <h3>Отримання даних послуг...</h3>
            </div>}
        </div>
    )
}

export default ServicesDataController;