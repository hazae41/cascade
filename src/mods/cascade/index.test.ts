import { FullDuplex } from "./index.js"

class A {
  readonly #class = A

  readonly duplex: FullDuplex<string>

  constructor() {
    this.duplex = new FullDuplex<string>({
      input: {
        open: () => this.#onInputOpen(),
        message: m => this.#onInputMessage(m),
        close: () => this.#onInputClose(),
        error: e => this.#onInputError(e)
      },
      output: {
        open: () => this.#onOutputOpen(),
        message: m => this.#onOutputMessage(m),
        close: () => this.#onOutputClose(),
        error: e => this.#onOutputError(e)
      }
    })
  }

  async #onInputOpen() {
    await new Promise(ok => setTimeout(ok, 1000))
    console.log(this.#class.name, "<-", "open")
  }

  async #onInputMessage(data: string) {
    console.log(this.#class.name, "<-", data)
    await new Promise(ok => setTimeout(ok, 1000))

    if (this.duplex.output.closing)
      return
    this.duplex.output.enqueue(data)
  }

  async #onInputClose() {
    console.log(this.#class.name, "<-", "close")
  }

  async #onInputError(reason?: unknown) {
    console.error(this.#class.name, "<-", "error", reason)
  }

  async #onOutputOpen() {
    await new Promise(ok => setTimeout(ok, 1000))
    console.log(this.#class.name, "->", "open")
  }

  async #onOutputMessage(data: string) {
    console.log(this.#class.name, "->", data)
  }

  async #onOutputClose() {
    console.log(this.#class.name, "->", "close")
  }

  async #onOutputError(reason?: unknown) {
    console.error(this.#class.name, "->", "error", reason)
  }

  send(data: string) {
    this.duplex.output.enqueue(data)
  }

  close() {
    this.duplex.output.close()
  }

}

class B {
  readonly #class = B

  readonly duplex: FullDuplex<string>

  constructor() {
    this.duplex = new FullDuplex<string>({
      input: {
        open: () => this.#onInputOpen(),
        message: m => this.#onInputMessage(m),
        close: () => this.#onInputClose(),
        error: e => this.#onInputError(e)
      },
      output: {
        open: () => this.#onOutputOpen(),
        message: m => this.#onOutputMessage(m),
        close: () => this.#onOutputClose(),
        error: e => this.#onOutputError(e)
      }
    })
  }

  async #onInputOpen() {
    await new Promise(ok => setTimeout(ok, 1000))
    console.log(this.#class.name, "<-", "open")
  }

  async #onInputMessage(data: string) {
    console.log(this.#class.name, "<-", data)
    await new Promise(ok => setTimeout(ok, 1000))

    if (this.duplex.output.closing)
      return
    this.duplex.output.enqueue(data)
  }

  async #onInputClose() {
    console.log(this.#class.name, "<-", "close")
    this.duplex.output.close()
  }

  async #onInputError(reason?: unknown) {
    console.error(this.#class.name, "<-", "error", reason)
  }

  async #onOutputOpen() {
    console.log(this.#class.name, "->", "open")
  }

  async #onOutputMessage(data: string) {
    console.log(this.#class.name, "->", data)
  }

  async #onOutputClose() {
    console.log(this.#class.name, "->", "close")
  }

  async #onOutputError(reason?: unknown) {
    console.error(this.#class.name, "->", "error", reason)
  }

  send(data: string) {
    this.duplex.output.enqueue(data)
  }

  close() {
    this.duplex.output.close()
  }

}

const a = new A()
const b = new B()

a.duplex.inner.readable.pipeTo(b.duplex.inner.writable).then(() => console.log("-> done")).catch(e => console.error("-> error", e))
b.duplex.inner.readable.pipeTo(a.duplex.inner.writable).then(() => console.log("<- done")).catch(e => console.error("<- error", e))

a.send("hello")

await new Promise(ok => setTimeout(ok, 10000))

a.close()