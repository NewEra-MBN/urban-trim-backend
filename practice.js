function checkPromise(resolve, reject, value) {
    reject("failed")
}

function  checkValue(value) {
    return new Promise((resolve, reject) => {
        checkPromise(resolve, reject, value)
    })
    .then(data => console.log(data))
    .catch(err => console.log('here is the error',err))
}


checkValue("Hi")