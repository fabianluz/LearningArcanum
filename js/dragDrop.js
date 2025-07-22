/**
 * Enable drag-and-drop reordering for items in a container.
 * @param {string} containerSelector - CSS selector for the container.
 * @param {string} itemSelector - CSS selector for draggable items inside the container.
 * @param {function} onDrop - Callback: onDrop(newOrderArrayOfIds)
 */
export function enableDragAndDrop(containerSelector, itemSelector, onDrop) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const items = Array.from(container.querySelectorAll(itemSelector));
  let dragSrcIdx = null;
  items.forEach((item, idx) => {
    item.setAttribute('draggable', 'true');
    item.ondragstart = (e) => {
      dragSrcIdx = idx;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    };
    item.ondragend = () => {
      item.classList.remove('dragging');
      dragSrcIdx = null;
      items.forEach(i => i.classList.remove('drag-over'));
    };
    item.ondragover = (e) => {
      e.preventDefault();
      if (dragSrcIdx !== null && dragSrcIdx !== idx) {
        item.classList.add('drag-over');
      }
    };
    item.ondragleave = () => {
      item.classList.remove('drag-over');
    };
    item.ondrop = (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (dragSrcIdx !== null && dragSrcIdx !== idx) {
        const newOrder = items.map(i => i.getAttribute('data-id'));
        // Move the dragged item in the newOrder array
        const moved = newOrder.splice(dragSrcIdx, 1)[0];
        newOrder.splice(idx, 0, moved);
        if (typeof onDrop === 'function') onDrop(newOrder);
      }
    };
  });
}
