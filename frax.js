const strs = {
  ASSIGNABLE: "wrap",
  PREFIX: "node_"
};

class Store {
  constructor() {
    this.nodes = {};
    this.clickableClassNames = {};
    this.listeners = {};
    this.data = {};
  }

  set(key, value) {
    const { data } = this;
    data[key] = value;
  }
  
  append(key, valueKey, value) {
    const { data } = this;
    data[key][valueKey] = value;
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
      if (typeof idOrTemplates !== "string") {
        templates = idOrTemplates;
        Object.keys(templates).forEach(key => store.set(key, []));
        if (document.readyState !== "loading") parent(store);
        else this.on(document, "DOMContentLoaded", () => parent(store));
        this.on(document, "keydown", event => {
          if (event.keyCode === 27) {
            document.querySelectorAll("*").forEach(item => item.blur());
          }
        });
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
      if (typeof templates[id] !== "function") {
        templates[id] = () => ``;
      }
      document.querySelector(
        `#${parent}`
      ).innerHTML += `<div id="${uniqueId}">${
        idOrTemplates !== "wrap" ? templates[id](store.get(id)) : ``
      }</div>`;
      if (typeof next === "string") {
        fetch("https://" + next)
          .then(response => response.json())
          .then(data => {
            store.set(idOrTemplates, data);
            frax(idOrTemplates, parent);
          });
      } else if (next === undefined) {
        Object.keys(store.clickableClassNames).forEach((key, index) => {
          document.querySelectorAll("." + key).forEach(item => item.id = `${key}_${index}`);
          this.on("." + key, "click", store.clickableClassNames[key]);
        });
      } else if (typeof next === "object") {
        Object.keys(next).forEach(key => {
          store.append(idOrTemplates, key, next[key]);
        });
        frax(idOrTemplates, parent);
      } else next(uniqueId);
    }.bind(this);
  }
  on(selector, event, action) {
    const assign = element =>
        element.addEventListener(
          event || null,
          this.store.listeners[selector] || null
        ),
      retract = element =>
        element.removeEventListener(
          event || null,
          this.store.listeners[selector] || null
        );
    selector === document
    ? assign(document)
    : document.querySelectorAll(selector).forEach((item, index) => {
        if (this.store.listeners[selector] !== undefined) {
          retract(item);
        }
        this.store.listeners[selector] = () => {
          action();
          const focusEvent = document.createEvent('HTMLEvents');
          focusEvent.initEvent('focus', true, false);
          document.getElementById(`${selector.slice(1)}_${index + 1}`).focus();
        }
        assign(item);
      });
  }
}

window.frax = new Frax();

// TODO: persist store in localStorage
