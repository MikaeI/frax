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
    return function(idOrTemplates, parent, next, _after) {
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
        if (elem !== null) elem.parentNode.removeChild(elem);
      }
      if (typeof templates[id] !== "function") {
        templates[id] = () => ``;
      }
      const after = uniqueId => {
        if (_after !== undefined) {
          _after(uniqueId);
        } else {
          Object.keys(store.clickableClassNames).forEach(key => {
            document
              .querySelectorAll("." + key)
              .forEach((item, index) => (item.id = `${key}_${index}`));
            this.on("." + key, "click", store.clickableClassNames[key]);
          });
        }
      };
      if (parent.indexOf("node_") === 0) {
        document.querySelector(
          `#${parent}`
        ).innerHTML += `<div id="${uniqueId}">${
          idOrTemplates !== "wrap" ? templates[id](store.get(id)) : ``
        }</div>`;
      } else {
        document.querySelector(
          `#${parent}`
        ).innerHTML = `<div id="${uniqueId}">${
          idOrTemplates !== "wrap" ? templates[id](store.get(id)) : ``
        }</div>`;
      }
      if (typeof next === "string") {
        fetch("https://" + next)
          .then(response => response.json())
          .then(data => {
            store.set(idOrTemplates, data);
            frax(idOrTemplates, parent);
            after(uniqueId);
          });
      } else if (next === undefined) {
        after(uniqueId);
      } else if (typeof next === "object") {
        Object.keys(next).forEach(key => {
          store.append(idOrTemplates, key, next[key]);
        });
        frax(idOrTemplates, parent);
      } else {
        if (_after === undefined) next(uniqueId);
      }
    }.bind(this);
  }
  on(selector, event, action) {
    const assign = (element, index) =>
      element.addEventListener(
        event || null,
        (element[`${selector.slice(1)}_${index}`] = function fn() {
          this.store.lastTarget = document.getElementById(
            `${selector.slice(1)}_${index}`
          ).value;
          this.store.listeners[selector]() || null;
        }.bind(this))
      );
    selector === document
      ? document.addEventListener(event || null, action)
      : document.querySelectorAll(selector).forEach((item, index) => {
          item.removeEventListener(
            event || null,
            item[`${selector.slice(1)}_${index}`]
          );
          this.store.listeners[selector] = () => {
            action();
            //const focusEvent = document.createEvent("HTMLEvents");
            //focusEvent.initEvent("focus", true, false);
            //document.getElementById(`${selector.slice(1)}_${index}`).focus();
          };
          assign(item, index);
        });
  }
}

window.frax = new Frax();

// TODO: persist store in localStorage
// TODO: undo/redo

