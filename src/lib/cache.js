const store = {}
const TTL = 2 * 60 * 1000 // 2 minutes

export const cache = {
  get(key) {
    const e = store[key]
    return e && Date.now() - e.t < TTL ? e.v : null
  },
  set(key, value) {
    store[key] = { v: value, t: Date.now() }
  },
  del(key) { delete store[key] },
}
