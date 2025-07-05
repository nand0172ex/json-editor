function createEditor(containerId) {
  return new JSONEditor(document.getElementById(containerId), {
    mode: 'code',
    modes: ['code', 'tree', 'text', 'form', 'view']
  });
}

const leftEditor = createEditor("leftEditor");
const rightEditor = createEditor("rightEditor");

function clearEditor(editor) {
  if (confirm("Clear this editor?")) editor.set({});
}

function toggleFullscreen(boxId) {
  document.getElementById(boxId).classList.toggle("fullscreen");
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
      alert("❌ Invalid JSON: " + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = ""; // reset for same file reload
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
    alert("❌ Save failed: " + err.message);
  }
}

function exportToNewTab(editor) {
  try {
    const content = JSON.stringify(editor.get(), null, 2);
    const newTab = window.open();
    newTab.document.write(`<pre>${content}</pre>`);
  } catch (err) {
    alert("❌ Export failed: " + err.message);
  }
}

// Copy between editors
document.getElementById("copyLeftToRight").onclick = () => {
  try {
    rightEditor.set(leftEditor.get());
  } catch (err) {
    alert("Copy failed: " + err.message);
  }
};
document.getElementById("copyRightToLeft").onclick = () => {
  try {
    leftEditor.set(rightEditor.get());
  } catch (err) {
    alert("Copy failed: " + err.message);
  }
};

// Compare
document.getElementById("compareBtn").onclick = () => {
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
};
