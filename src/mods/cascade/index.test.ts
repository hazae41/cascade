import { None } from "@hazae41/option"
import { HalfDuplex } from "./index.js"

const a = new HalfDuplex<string>()
const b = new HalfDuplex<string>()

a.input.events.on("message", (data) => {
  console.log(data)
  return new None()
})

b.input.events.on("message", (data) => {
  b.output.enqueue(data)
  return new None()
})

a.inner.readable.pipeTo(b.inner.writable)
b.inner.readable.pipeTo(a.inner.writable)

a.output.enqueue("hello")