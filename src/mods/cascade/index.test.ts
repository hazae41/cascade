import { HalfDuplex } from "./index.js"

class A {
  readonly #class = A

  readonly duplex: HalfDuplex<string>

  constructor() {
    this.duplex = new HalfDuplex<string>({
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
    await this.duplex.output.close()
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

  async send(data: string) {
    await this.duplex.output.enqueue(data)
  }

}

class B {
  readonly #class = B

  readonly duplex: HalfDuplex<string>

  constructor() {
    this.duplex = new HalfDuplex<string>({
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
    await this.duplex.output.enqueue(data)
  }

  async #onInputClose() {
    console.log(this.#class.name, "<-", "close")
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

  async send(data: string) {
    await this.duplex.output.enqueue(data)
  }

}

const a = new A()
const b = new B()

a.duplex.inner.readable.pipeTo(b.duplex.inner.writable).then(() => console.log("-> done")).catch(e => console.error("-> error", e))
b.duplex.inner.readable.pipeTo(a.duplex.inner.writable).then(() => console.log("<- done")).catch(e => console.error("<- error", e))

a.send("hello")

while (true) { }

class MySocket extends EventTarget {

  readonly #duplex = new HalfDuplex<string, string>({
    input: { message: m => this.#onMessage(m) },
    error: e => this.#onError(e),
    close: () => this.#onClose(),
  })

  async send(message: string) {
    await this.#duplex.output.enqueue(message)
  }

  async error(reason?: unknown) {
    await this.#duplex.output.error(reason)
  }

  async close() {
    await this.#duplex.output.close()
  }

  async #onMessage(data: string) {
    this.dispatchEvent(new MessageEvent("message", { data }))
  }

  async #onError(reason?: unknown) {
    this.dispatchEvent(new ErrorEvent("error", { error: reason }))
  }

  async #onClose() {
    this.dispatchEvent(new Event("close"))
  }

}