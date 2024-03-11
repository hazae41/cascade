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

A pair of simplexes that are closed independently

- When one side is errored, the other is automatically errored
- When one side is closed, the other is NOT automatically closed

Events
- error — called ONCE when input OR output are errored
- close — called ONCE when input AND output are closed

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

A pair of simplexes that are closed together

- When one side is errored, the other is automatically errored
- When one side is closed, the other is automatically closed

Events
- error — called ONCE when input AND output are errored
- close — called ONCE when input AND output are closed

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

