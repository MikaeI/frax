const strs = {
  ASSIGNABLE: "wrap",
  PREFIX: "node_"
};

class Store {
  constructor() {
    this.nodes = {};
    this.data = {};
  }

  set(key, value) {
    const { data } = this;
    data[key] = value;
  }

  get(key) {
    const { data } = this;
    return data[key] || {};
  }
}

let templates;

class Frax {
  constructor() {
    this.store = new Store();
    return function(idOrTemplates, parent, next) {
      let id = idOrTemplates;
      const { store } = this,
        { nodes } = store;
      if (next === undefined) {
        templates = idOrTemplates;
        Object.keys(templates).forEach(key => store.set(key, []));
        if (document.readyState !== "loading") parent(store);
        else on(document, "DOMContentLoaded", () => parent(store));
        return false;
      }
      let uniqueId;
      if (!nodes[id])
        if (id === strs.ASSIGNABLE)
          nodes[
            (uniqueId =
              strs.PREFIX +
              Object.keys(nodes).filter(key => key.match(strs.PREFIX, /^$/))
                .length)
          ] = {};
        else nodes[(uniqueId = id)] = {};
      else {
        const elem = document.getElementById((uniqueId = id));
        if (elem === null) return false;
        elem.parentNode.removeChild(elem);
      }
      document.querySelector(
        `#${parent}`
      ).innerHTML += `<div id="${uniqueId}">${templates[id](
        store.get(id)
      )}</div>`;
      next(uniqueId);
    }.bind(this);
  }
}

window.frax = new Frax();
window.frax.on = (selector, event, action) => {
  const assign = element =>
    element.addEventListener(event || null, action || null);
  selector === document
    ? assign(document)
    : document.querySelectorAll(selector).forEach(item => assign(item));
};

