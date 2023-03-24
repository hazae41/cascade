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

```typescript
const stream = new SuperTransformStream({ write })

async function write(chunk: Uint8Array) {
  stream.enqueue(chunk)
}

async function onEvent() {
  stream.enqueue(new Uint8Array([1, 2, 3]))
}

addEventListener("event", onEvent)
```