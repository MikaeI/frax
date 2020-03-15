class Store {
  constructor() {
    this.nodes = {};
    this.changeableClassNames = {};
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
    this.workers = {};
    return function(node, value, _after) {
      let elem, after;
      const { store, workers } = this,
        { nodes } = store;
      if (node instanceof Array) {
        templates = node[0];
        node[1].forEach(
          worker =>
            (workers[worker.split("_")[0]] = new Worker(worker, {
              type: "module"
            }))
        );
        Object.keys(templates).forEach(key => store.set(key, []));
        if (document.readyState !== "loading") value(store, workers);
        else this.on(document, "DOMContentLoaded", () => value(store, workers));
        this.on(document, "keydown", event => {
          if (event.keyCode === 27) {
            document.querySelectorAll("*").forEach(item => item.blur());
          }
        });
        return false;
      }
      after = () => {
        if (_after !== undefined) _after();
        else {
          Object.keys(store.clickableClassNames).forEach(key => {
            document
              .querySelectorAll("." + key)
              .forEach((item, index) => (item.id = `${key}_${index}`));
            this.on("." + key, "click", store.clickableClassNames[key]);
          });
          Object.keys(store.changeableClassNames).forEach(key => {
            document
              .querySelectorAll("." + key)
              .forEach((item, index) => (item.id = `${key}_${index}`));
            this.on("." + key, "change", store.changeableClassNames[key]);
          });
          setTimeout(() => {
            document.querySelectorAll(".deleteme").forEach(el => {
              el.parentNode.removeChild(el);
            });
          }, 500);
        }
      };
      if (!nodes[node]) {
        nodes[node] = {};
        document.body.innerHTML += `<section id="${node}">${templates[node](
          store.get(node)
        )}</section>`;
      } else {
        document.getElementById(node).innerHTML = templates[node](
          store.get(node)
        );
      }
      if (typeof value === "string") {
        value.indexOf(".") !== -1
          ? fetch(value.indexOf("->") !== -1 ? value.split("->")[1] : value)
              .then(response => response.json())
              .then(data => {
                if (value.indexOf("->") !== -1) {
                  store.append(node, value.split("->")[0], data);
                } else {
                  store.set(node, data);
                }
                frax(node);
                after();
              })
          : (() => {
              let obj = store.get(node);
              obj[value.split("/")[0]] = store.get(node)[value.split("/")[0]];
              obj[value.split("/")[0]][value.split("/")[1]] =
                store.lastTarget.value;
              store.set(node, obj);
              frax(node);
              after();
            })();
      } else if (typeof value === "object") {
        Object.keys(value).forEach(key => {
          store.append(node, key, value[key]);
        });
        frax(node);
        after();
      } else after();
    }.bind(this);
  }
  on(selector, event, action) {
    const assign = (element, index) =>
      element.addEventListener(
        event || null,
        (element[`${selector.slice(1)}_${index}`] = function fn() {
          this.store.lastTarget = document.getElementById(
            `${selector.slice(1)}_${index}`
          );
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
// persist in localstorage

