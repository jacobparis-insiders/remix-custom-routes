const PrefixLookupTrieEndSymbol = Symbol("PrefixLookupTrieEndSymbol")

class PrefixLookupTrie {
  constructor() {
    this.root = {
      [PrefixLookupTrieEndSymbol]: false,
    }
  }

  add(value) {
    if (!value) throw new Error("Cannot add empty string to PrefixLookupTrie")
    let node = this.root
    for (const char of value) {
      if (!node[char]) {
        node[char] = {
          [PrefixLookupTrieEndSymbol]: false,
        }
      }
      node = node[char]
    }
    node[PrefixLookupTrieEndSymbol] = true
  }

  findAndRemove(prefix, filter) {
    let node = this.root
    for (const char of prefix) {
      if (!node[char]) return []
      node = node[char]
    }
    return this.#findAndRemoveRecursive([], node, prefix, filter)
  }

  #findAndRemoveRecursive(values, node, prefix, filter) {
    for (const char of Object.keys(node)) {
      this.#findAndRemoveRecursive(values, node[char], prefix + char, filter)
    }
    if (node[PrefixLookupTrieEndSymbol] && filter(prefix)) {
      node[PrefixLookupTrieEndSymbol] = false
      values.push(prefix)
    }
    return values
  }
}

module.exports = {
  PrefixLookupTrie,
}
