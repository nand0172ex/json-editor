const leftEditor = new JSONEditor(document.getElementById("leftEditor"), {
  mode: "code",
  modes: ["code", "tree", "text", "form", "view"]
});
const rightEditor = new JSONEditor(document.getElementById("rightEditor"), {
  mode: "code",
  modes: ["code", "tree", "text", "form", "view"]
});

function clearEditor(editor, side) {
  editor.set({});
  document.getElementById(`${side}Table`).style.display = "none";
  document.getElementById(`${side}Tree`).style.display = "none";
  document.getElementById(`${side}Tree`).innerHTML = "";
}

function convertToTable(editor, containerId) {
  try {
    const jsonData = editor.get();
    let dataArray = [];

    if (Array.isArray(jsonData)) {
      dataArray = jsonData;
    } else if (typeof jsonData === 'object') {
      dataArray = [flattenObject(jsonData)];
    }

    const container = document.getElementById(containerId);
    container.style.display = "block";
    container.innerHTML = "";

    new Tabulator(`#${containerId}`, {
      data: dataArray,
      layout: "fitData",
      responsiveLayout: "collapse",
      columns: Object.keys(dataArray[0] || {}).map(key => ({
        title: key,
        field: key
      }))
    });
  } catch (err) {
    alert("Table conversion failed: " + err.message);
  }
}

function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = Array.isArray(obj[k]) ? obj[k].join(',') : obj[k];
    }
    return acc;
  }, {});
}

function convertToTreeView(editor, side) {
  try {
    const jsonData = editor.get();
    const container = document.getElementById(`${side}Tree`);
    container.innerHTML = "";
    container.style.display = "block";

    const nodeStructure = jsonToTreant(jsonData);

    new Treant({
      chart: {
        container: `#${side}Tree`,
        scrollbar: "fancy",
        node: { collapsable: true }
      },
      nodeStructure: nodeStructure
    });
  } catch (err) {
    alert("Tree conversion failed: " + err.message);
  }
}

function jsonToTreant(data, label = "Root") {
  const node = { text: { name: label } };

  if (typeof data === "object" && data !== null) {
    node.children = [];

    for (let key in data) {
      const child = jsonToTreant(data[key], key);
      node.children.push(child);
    }

    if (node.children.length === 0) delete node.children;
  } else {
    node.text.name = `${label}: ${data}`;
  }

  return node;
}

function copyLeftToRight() {
  try {
    rightEditor.set(leftEditor.get());
  } catch (err) {
    alert("Copy failed: " + err.message);
  }
}

function copyRightToLeft() {
  try {
    leftEditor.set(rightEditor.get());
  } catch (err) {
    alert("Copy failed: " + err.message);
  }
}

function toggleFullscreen(editorId) {
  const editorContainer = document.getElementById(editorId).parentElement;
  const side = editorId.includes('left') ? 'left' : 'right';
  editorContainer.classList.toggle("fullscreen");
  const show = editorContainer.classList.contains("fullscreen");
  document.getElementById(`${side}Table`).style.display = show ? "block" : "";
  document.getElementById(`${side}Tree`).style.display = show ? "block" : "";
}

function compareJson() {
  try {
    const left = leftEditor.get();
    const right = rightEditor.get();
    const delta = jsondiffpatch.diff(left, right);
    if (!delta) {
      alert("✅ Both JSONs are identical.");
      return;
    }

    const diffHtml = jsondiffpatch.formatters.html.format(delta, left);
    const newWin = window.open();
    newWin.document.write(`
      <html><head><title>Compare</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        ins { background: #e6ffe6; text-decoration: none; }
        del { background: #ffe6e6; text-decoration: line-through; }
      </style></head><body>${diffHtml}</body></html>
    `);
  } catch (err) {
    alert("Compare failed: " + err.message);
  }
}
