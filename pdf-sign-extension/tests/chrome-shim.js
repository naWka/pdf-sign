// Injected before the editor's own scripts. Provides just enough of the chrome.*
// surface the editor page touches, backed by in-memory storage, and captures any
// download so the test can inspect the exported PDF bytes. Runs in page context.
(() => {
  const store = {}
  const changeListeners = []

  window.__downloads = []
  window.__storage = store

  window.chrome = {
    runtime: {
      id: 'test-extension',
      getURL: (p) => '/' + String(p).replace(/^\/+/, ''),
      sendMessage: () => {},
      openOptionsPage: () => {},
      onMessage: { addListener() {}, removeListener() {} },
    },
    storage: {
      local: {
        get(key) {
          // Single-string-key form is all the app uses.
          const result = {}
          if (typeof key === 'string') result[key] = store[key]
          else if (Array.isArray(key)) key.forEach((k) => (result[k] = store[k]))
          else if (key && typeof key === 'object') Object.keys(key).forEach((k) => (result[k] = k in store ? store[k] : key[k]))
          else Object.assign(result, store)
          return Promise.resolve(result)
        },
        set(obj) {
          const changes = {}
          for (const k of Object.keys(obj)) {
            changes[k] = { oldValue: store[k], newValue: obj[k] }
            store[k] = obj[k]
          }
          changeListeners.forEach((cb) => cb(changes, 'local'))
          return Promise.resolve()
        },
      },
      onChanged: {
        addListener: (cb) => changeListeners.push(cb),
        removeListener: (cb) => {
          const i = changeListeners.indexOf(cb)
          if (i >= 0) changeListeners.splice(i, 1)
        },
      },
    },
    downloads: {
      download(opts, cb) {
        // Read the blob URL the app created and stash the bytes for assertions.
        fetch(opts.url)
          .then((r) => r.arrayBuffer())
          .then((buf) => {
            const bytes = new Uint8Array(buf)
            let bin = ''
            for (const b of bytes) bin += String.fromCharCode(b)
            window.__downloads.push({
              filename: opts.filename,
              size: bytes.length,
              base64: btoa(bin),
              head: bin.slice(0, 5),
            })
          })
        if (cb) cb(1)
      },
    },
    contextMenus: { create() {}, onClicked: { addListener() {} } },
  }
})()
