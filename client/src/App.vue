<template>
  <div id="page">
    <h2 id="title">Beachat</h2>
    <code id="terminal">
      <p v-for="(line, index) in terminal" :key="index">
        {{line}}
      </p>
    </code>
    <div id="row">
      <input ref="input" id="input" type="text" v-on:keyup.enter="sendFromInput" v-model="input" placeholder="Type message here"/>
      <input id="sendKeepalive" type="checkbox" v-model='sendKeepalive' checked=true/>
      <label for="sendKeepalive">Keepalive</label>
    </div>
  </div>
</template>

<script>
const KEEPALIVE_TIMER = 10
export default {
  name: 'App',
  components: {
  },
  data() {
    return {
      input: "",
      terminal: [],
      socket: null,
      keepaliveTimer: null,
      sendKeepalive: true
    }
  },
  methods: {
    sendFromInput() {
      this.send(this.input)
      this.input = ''
    },
    send(message) {
      this.socket.send(message)
    },
    addLine(line) {
      this.terminal.push(line)
      const lastP = document.querySelector("#terminal p:last-child")
      if(lastP) {
        window.setTimeout(()=>lastP.scrollIntoView(), 100)
      }
    },
    connect(name) {
      this.addLine("Connecting to server...")
      this.socket = new WebSocket(`ws://dev.hypersweet.com:8080?name=${name}`)
      this.socket.onmessage = (event) => {
        this.addLine(event.data)
      }
    }
  },
  mounted() {
    const randomUserName = "user" + Math.floor(Math.random() * 9999)
    const name = prompt("Enter a user name", randomUserName)
    this.connect(name)
    this.keepaliveTimer = setInterval(()=> {
      if (this.sendKeepalive) {
        this.send("/keepalive")
      }
    }, KEEPALIVE_TIMER * 1000)
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
  /*border: 1em solid #444;*/
  border-radius: 15px;
  box-sizing: border-box;
  height: calc(100vh - 10rem);
  color: #eee;
  display: block;
  overflow-y: scroll;
  padding: 0 0 0 1em;
}
#terminal p {
  margin: 0;
  padding: .5em 0 0 0;
}
#row {
  align-items: center;
  display: flex;
  font-family: monospace;
}
#row #sendKeepalive {
  display: block;
  margin: 0 1em;
}
#row label {
  color: #555;
  display: block;
}
#sendKeepalive:checked + label {
  color: #eee;
}
#input {
  background: #444;
  border-radius: 15px;
  color: #eee;
  flex-grow: 1;
  height: 1rem;
  margin-top: 1em;
  padding: .5em 1em .5em 1em;
}
</style>
