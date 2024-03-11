# Cascade

Never let streams give you a headache again

```bash
npm i @hazae41/cascade
```

[**Node Package 📦**](https://www.npmjs.com/package/@hazae41/cascade)

## Why

It took me 1 year to manage JavaScript streams in such a way as to avoid headaches, fortunately you can skip this struggle and never get any headache (and even avoid Safari bugs!)

## Features

### Current features
- 100% TypeScript and ESM
- No external dependencies
- No need for controller access
- Simplex, Half-Duplex, Full-Duplex
- Use Symbol.dispose to close streams

## Usage

### Streams

For basic scenarios, Cascade provides streams but with an accessible controller

```typescript
const encoder = new SuperTransformStream<Uint8Array, Uint8Array>({ write: onWrite })

async function onWrite(chunk: Uint8Array) {
  /** 
   * No need to get the controller 
   */
  await stream.enqueue(encode(chunk))
}

example.readable
  .pipeTo(encoder.substream.writable)
  .then(() => console.log("Closed"))
  .catch(e => console.error("Errored", e))

encoder.substream.readable
  .pipeTo(example.writable)
  .then(() => console.log("Closed"))
  .catch(e => console.error("Errored", e))

/**
 * You can close it at any time
 */
encoder.terminate()
```


### Plexes

For more complex scenarios, Cascade provides plexes, which are streams with events, and you can associate them to build complex and reliable structures

#### Simplex

A basic in-out stream with events

Depending on how you use it, it can act as both a transform, readable, and writable stream

```tsx
const simplex = new Simplex<Uint8Array>()

/**
 * You can use pipes
 */
example.readable
  .pipeTo(simplex.writable)
  .then(() => console.log("Closed"))
  .catch(e => console.error("Errored", e))

simplex.readable
  .pipeTo(example.writable)
  .then(() => console.log("Closed"))
  .catch(e => console.error("Errored", e))

/**
 * You can also use events
 */
const simplex = new Simplex<Uint8Array>({
  /**
   * When the simplex is open
   */
  async open() {
    this.enqueue(new Uint8Array([0, 1, 2]))
  },
  /**
   * When the simplex is closing
   */
  async flush() {
    this.enqueue(new Uint8Array([7, 8, 9]))
  },
  /**
   * When the simplex is closed
   */
  async close() {
    console.log("Closed")
  },
  /**
   * When the simplex is errored
   */
  async error(error) {
    console.log("Errored", error)
  },
  /**
   * When the simplex receives a message
   */
  async message(message) {
    this.enqueue(message)
  },
})

/**
 * You can enqueue it at any time
 */
simplex.enqueue(new Uint8Array([4, 5, 6]))

/**
 * You can close it at any time
 */
simplex.close()
```

#### Full-Duplex

A pair of simplexes that are closed independently

- When one side is errored, the other is automatically errored
- When one side is closed, the other is NOT automatically closed

Events
- error — called ONCE when input OR output are errored
- close — called ONCE when input AND output are closed

```tsx
class Crypter extends FullDuplex<Uint8Array, Uint8Array> {

  constructor() {
    super({
      input: { message: m => this.#onInputMessage(m) },
      output: { message: m => this.#onOutputMessage(m) },
      close: () => this.#onClose(),
      error: e => this.#onError(e)
    })
  }

  async #onInputMessage(data: Uint8Array) {
    this.input.enqueue(await encrypt(data))
  }

  async #onOutputMessage(data: Uint8Array) {
    this.output.enqueue(await decrypt(data))
  }

  async #onError(reason?: unknown) {
    console.error("Errored", reason)
  }

  async #onClose() {
    console.log("Closed")
  }

}

function crypt(subprotocol: FullDuplex<Uint8Array, Uint8Array>) {
  const crypter = new Crypter()

  subprotocol.outer.readable.pipeTo(crypter.inner.writable).catch(() => { })
  crypter.inner.readable.pipeTo(subprotocol.outer.writable).catch(() => { })

  return crypter
}
```


#### Half-Duplex

A pair of simplexes that are closed together

- When one side is errored, the other is automatically errored
- When one side is closed, the other is automatically closed

Events
- error — called ONCE when input OR output are errored
- close — called ONCE when input OR output are closed

```tsx
class MySocket extends EventTarget {

  readonly #duplex = new HalfDuplex<string, string>({
    input: { message: m => this.#onMessage(m) },
    error: e => this.#onError(e),
    close: () => this.#onClose(),
  })

  get inner() {
    return this.#duplex.inner
  }

  send(message: string) {
    this.#duplex.output.enqueue(message)
  }

  error(reason?: unknown) {
    this.#duplex.output.error(reason)
  }

  close() {
    this.#duplex.output.close()
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
```

