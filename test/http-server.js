const http = require('node:http')
const connect = require('connect')
const serveStatic = require('serve-static')

const app = connect()
const server = http.createServer(app)

app.use(serveStatic('test'))

server.listen(8000)

module.exports = () => {
  server.close()
}

console.log('Tests available at http://localhost:8000/')
