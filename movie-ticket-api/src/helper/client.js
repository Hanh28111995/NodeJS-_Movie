import axios from 'axios'

export const sendSuccess = (res, message, data = null) => {
  let responseJson = {
    success: true,
    message: message,
  };
  if (data) {
    // Trả về đúng cấu trúc ban đầu: data chứa content
    responseJson.content = data;
  }
  return res.status(200).json(responseJson);
};

export const sendError = (res, message, code = 400) => {
    return res.status(code).json({
        success: false,
        message: message
    })
}

export const sendServerError = res =>
    res.status(500).json({
        success: false,
        message: 'Server Interval Error.'
    })

/**
 * 
 * @param {*} url 
 * @param {*} method 
 * @param {*} headers : array string ['Authorzied: Bearer token']
 * @param {*} data : object
 */
export const sendRequest = async (url, method, headers = [], postData = {}) => {
    const dataJSON = JSON.stringify(postData)
    const encodedURI = encodeURI(url);
    const config = {
        url: encodedURI,
        method: method,
        headers: headers,
        data: dataJSON
    }
    const { status, data } = await axios(config)
    return { status, data }
}

