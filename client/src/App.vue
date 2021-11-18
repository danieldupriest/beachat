<template>
  <div id="page">
    <h2 id="title">Beachat</h2>
    <code id="terminal">
      <p v-for="(line, index) in terminal" :key="index">
        {{line}}
      </p>
    </code>
    <input ref="input" id="input" type="text" v-on:keyup.enter="send" v-model="input" placeholder="Type message here"/>
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
      this.socket.send(this.input)
      this.input = ''
    },
    addLine(line) {
      this.terminal.push(line)
      const lastP = document.querySelector("#terminal p:last-child")
      if(lastP) {
        window.setTimeout(()=>lastP.scrollIntoView(), 100)
      }
    },
    connect(name) {
      this.addLine("Connecting to server")
      this.socket = new WebSocket(`ws://dev.hypersweet.com:8080?name=${name}`)
      this.socket.onopen = () => {
        this.addLine("Connection established")
      }
      this.socket.onmessage = (event) => {
        this.addLine(event.data)
      }
    }
  },
  mounted() {
    const randomUserName = "user" + Math.floor(Math.random() * 9999)
    const name = prompt("Enter a user name", randomUserName)
    this.connect(name)
    this.$refs.input.focus()
  }
}
</script>

<style>
html, body {
  min-height: 100vh;
  margin: 0;
  padding: 0;
}
#app {
  background: #333;
  min-height: 100vh;
}
#page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 80ch;
  margin: 0 auto;
}
#title {
    background: -webkit-linear-gradient(#aaf, #3a3);
    font-size: 300%;
    background-clip: text;
    height: 3rem;
    -webkit-text-fill-color: transparent;
    padding: .25em 0;
    margin: 0;
}
#terminal {
  background: #444;
  border: 1em solid #444;
  border-radius: 15px;
  box-sizing: border-box;
  height: calc(100vh - 10rem);
  color: #eee;
  display: block;
  overflow-y: scroll;
}
#terminal p {
  margin: 0;
  padding: .5em 0 0 0;
}
#input {
  background: #444;
  border-radius: 15px;
  color: #eee;
  font-family: monospace;
  height: 1rem;
  margin-top: 1em;
  padding: .5em 1em .5em 1em;
}
</style>
