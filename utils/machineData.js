const axios = require('axios');

const apiData = async () => {
    let data = await axios.get('http://192.168.0.107:81/wmsnew/api');
    data = JSON.parse(data);
    return data;
}

module.exports = { apiData };