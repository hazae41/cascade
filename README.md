# Cascade

```bash
npm i @hazae41/cascade
```

[**Node Package 📦**](https://www.npmjs.com/package/@hazae41/cascade)

## Features

### Current features
- 100% TypeScript and ESM
- No external dependencies
- Use stream.controller to get the controller
- Use stream.closed to check if the stream is closed (and the reason)

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

/**
 * When the pipe is closed
 */
simplex.on("close", async () => {
  console.log("Closed")
  return new None()
})

/**
 * When the pipe is errored
 */
simplex.on("error", async (reason) => {
  console.error("Errored", e)
  return new None()
})

/**
 * When you got some chunk
 */
simplex.on("message", async (chunk) => {
  console.log(chunk)

  /**
   * Pass it to the next stream in the pipe (optional)
   */
  simplex.enqueue(chunk)

  return new None()
})

/**
 * When the simplex is about to close
 */
simplex.on("flush", async (chunk) => {
  simplex.enqueue(new TextEncoder().encode("Bye"))
  return new None()
})

/**
 * You can close it at any time
 */
simplex.close()
```

#### Full-Duplex

This is just two simplexes (input & output) but combined in a way to be highly reusable

```tsx
class Crypter extends FullDuplex<Uint8Array, Uint8Array> {

  constructor() {
    super()

    this.output.on("message", async chunk => {
      this.output.enqueue(await encrypt(chunk))
      return new None()
    })

    this.input.on("message", async chunk => {
      this.input.enqueue(await decrypt(chunk))
      return new None()
    })
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

This is like a full-duplex, but when one simplex is closed or errored, the other is too

This is useful when you do not want to keep one side open

You also have duplex events
- open — called when input or output is started
- close — called when input or output is closed
— error — called when input or output is errored

```tsx
class MySocket {

  readonly #duplex = new HalfDuplex<string, string>()

  async send(message: string) {
    await this.#duplex.output.enqueue(message)
  }

  async close() {
    await this.#duplex.output.close()
  }

  async onMessage(listener: (message: string) => void) {
    this.#duplex.input.events.on("message", async message => {
      listener(message)
      return new None()
    })
  }

  async onClose(listener: () => void) {
    this.#duplex.events.on("close", async () => {
      listener()
      return new None()
    })
  }

  async onError(listener: (reason?: unknown) => void) {
    this.#duplex.events.on("error", async (reason) => {
      listener(reason)
      return new None()
    })
  }

}
```

