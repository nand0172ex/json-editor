 const leftEditor = new JSONEditor(document.getElementById("leftEditor"), {
    mode: 'code',
    modes: ['code', 'tree', 'form']
  });

  const rightEditor = new JSONEditor(document.getElementById("rightEditor"), {
    mode: 'code',
    modes: ['code', 'tree', 'form']
  });

  function clearEditor(editor, tableContainerId) {
    if (confirm("Clear this editor and table?")) {
      editor.set({});
      document.getElementById(tableContainerId).innerHTML = ""; // clear table
    }
  }

  function loadFile(event, editor) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const json = JSON.parse(e.target.result);
        editor.set(json);
      } catch (err) {
        alert("Invalid JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // reset
  }

  function saveToFile(editor) {
    try {
      const content = JSON.stringify(editor.get(), null, 2);
      const blob = new Blob([content], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "data.json";
      a.click();
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  }

  function copyEditor(from, to) {
    try {
      to.set(from.get());
    } catch (err) {
      alert("Copy failed: " + err.message);
    }
  }

  function compareJSONs() {
    try {
      const delta = jsondiffpatch.diff(leftEditor.get(), rightEditor.get());
      if (!delta) {
        alert("✅ Both JSONs are identical.");
        return;
      }

      const diffHtml = jsondiffpatch.formatters.html.format(delta, leftEditor.get());
      const newWin = window.open();
      newWin.document.write(`
        <html><head><title>Diff</title>
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

  function flattenObject(obj, prefix = '', res = {}) {
    for (let key in obj) {
      const val = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        flattenObject(val, newKey, res);
      } else {
        res[newKey] = Array.isArray(val) ? val.join(', ') : val;
      }
    }
    return res;
  }

  function convertToTabulator(editor, containerId) {
    try {
      const json = editor.get();
      const rows = Array.isArray(json) ? json : [json];
      const flatRows = rows.map(row => flattenObject(row));
      document.getElementById(containerId).innerHTML = ""; // reset
      new Tabulator(`#${containerId}`, {
        data: flatRows,
        layout: "fitColumns",
        columns: Object.keys(flatRows[0] || {}).map(key => ({ title: key, field: key }))
      });
    } catch (err) {
      alert("Tabulator error: " + err.message);
    }
  }

  function convertLeftToTabulator() {
    convertToTabulator(leftEditor, "leftTableContainer");
  }

  function convertRightToTabulator() {
    convertToTabulator(rightEditor, "rightTableContainer");
  }

  function toggleFullscreen(id) {
    const el = document.getElementById(id);
    el.classList.toggle("fullscreen");
  }
