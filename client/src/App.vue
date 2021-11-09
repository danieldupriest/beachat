<template>
  <div class="page">
    <h2>Beachat</h2>
    <code>
      <p v-for="(line, index) in terminal" :key="index">
        {{line}}
      </p>
      </code>
    <input type="text" v-on:keyup.enter="send" v-model="input" />
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {
  },
  data() {
    return {
      input: "",
      terminal: [],
      socket: null
    }
  },
  methods: {
    send() {
      console.log("In send: Input:" + this.input)
      this.socket.send(this.input)
    },
    addLine(line) {
      this.terminal.push(line)
    },
    connect(name) {
      this.addLine("Connecting to server")
      this.socket = new WebSocket(`ws://127.0.0.1:3000?name=${name}`)
      this.socket.onopen = () => {
        this.addLine("Connection established")
        this.socket.send("/connect")
      }
      this.socket.onmessage = (event) => {
        this.addLine(event.data)
      }
    }
  },
  created() {
    const randomUserName = "user" + Math.floor(Math.random() * 9999)
    const name = prompt("Enter a user name", randomUserName)
    this.connect(name)
  }
}
</script>

<style>
</style>
