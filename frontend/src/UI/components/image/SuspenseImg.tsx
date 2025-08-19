//@ts-nocheck

const imgCache = {
  __cache: {},
  read(src) {
    if (!this.__cache[src]) {
      this.__cache[src] = new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          this.__cache[src] = true
          resolve(this.__cache[src])
        }
        img.src = src
      }).then(() => {
        this.__cache[src] = true
      })
    }
    if (this.__cache[src] instanceof Promise) {
      throw this.__cache[src]
    }
    return this.__cache[src]
  },
}

export const SuspenseImg = ({ src, ...rest }) => {
  imgCache.read(src)
  return <img src={src} {...rest} />
}
