exports.handler = async function (event) {
    console.log('request:', JSON.stringify(event, undefined, 2))
    console.log(`Message received from Queue is ${event.body}\n`)
  }  