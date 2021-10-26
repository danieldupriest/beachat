<template>
  <h2>From Server</h2>
  <p>{{text}}</p>
</template>

<script>
export default {
  name: 'App',
  components: {
  },
  data() {
    return {
      text: "",
      socket: null
    }
  },
  methods: {
    sendMessage() {
      return
    }
  },
  created() {
    //const url = `ws://${process.env.SERVER_URL}:${process.env.PORT}`
    //console.log("Connecting to: " + url)
    console.log("Connecting to server")
    this.socket = new WebSocket('ws://127.0.0.1:3000')
    this.socket.onopen = () => {
      console.log("Opened")
      this.socket.send("Hello Server!")
    }
    this.socket.onmessage = (event) => {
      console.log("Message from server: " + event.data)
    }
  }
}
</script>

<style>
</style>
