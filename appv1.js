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
  document.getElementById(`${side}Table`).innerHTML = "";
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

function convertToTreeView(editor, containerId) {
  try {
    const jsonData = editor.get();
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    const ul = document.createElement("ul");
    buildTree(jsonData, ul);
    container.appendChild(ul);
  } catch (err) {
    alert("Tree conversion failed: " + err.message);
  }
}

function buildTree(data, parent) {
  if (typeof data !== 'object' || data === null) {
    const li = document.createElement('li');
    li.textContent = String(data);
    parent.appendChild(li);
    return;
  }

  for (const key in data) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${key}</strong>`;
    const ul = document.createElement('ul');
    buildTree(data[key], ul);
    li.appendChild(ul);
    parent.appendChild(li);
  }
}

// Copy & Compare Functions
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

  // Toggle fullscreen
  editorContainer.classList.toggle("fullscreen");

  // Always show Table & Tree inside fullscreen
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
