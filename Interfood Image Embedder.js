// ==UserScript==
// @name         Interfood Image Enhancer with Hover Zoom and Meal Planner
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Show food images on Interfood, enlarge on hover, and add personal meal planner tables with checkboxes that persist across reloads.
// @author       Fábián Tamás - fabiantamas.com
// @match        https://rendel.interfood.hu/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // === IMAGE PREVIEW ON HOVER ===
    const previewImg = document.createElement('img');
    previewImg.style.position = 'fixed';
    previewImg.style.pointerEvents = 'none';
    previewImg.style.zIndex = '10000';
    previewImg.style.maxWidth = '1200px';
    previewImg.style.maxHeight = '1200px';
    previewImg.style.border = '2px solid #ccc';
    previewImg.style.borderRadius = '8px';
    previewImg.style.display = 'none';
    previewImg.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    document.body.appendChild(previewImg);

    function showPreview(e) {
        previewImg.src = e.target.src;
        previewImg.style.left = `${e.pageX + 20}px`;
        previewImg.style.top = `${e.pageY + 20}px`;
        previewImg.style.display = 'block';
    }

    function movePreview(e) {
        previewImg.style.left = `${e.pageX + 20}px`;
        previewImg.style.top = `${e.pageY + 20}px`;
    }

    function hidePreview() {
        previewImg.style.display = 'none';
    }

    function addImages() {
        const foodDivs = document.querySelectorAll('.food[data-menu-item-id]');
        foodDivs.forEach(food => {
            const menuId = food.getAttribute('data-menu-item-id');
            if (!menuId) return;

            if (food.querySelector('.interfood-image')) return;

            const img = document.createElement('img');
            img.src = `https://ia.interfood.hu/api/v1/i?menu_item_id=${menuId}`;
            img.alt = 'Ételfotó';
            img.className = 'interfood-image';
            img.style.width = '100%';
            img.style.borderRadius = '8px';
            img.style.marginBottom = '5px';
            img.style.cursor = 'zoom-in';

            img.addEventListener('mouseenter', showPreview);
            img.addEventListener('mousemove', movePreview);
            img.addEventListener('mouseleave', hidePreview);

            const topSection = food.querySelector('.food-top');
            if (topSection) {
                topSection.insertAdjacentElement('beforebegin', img);
            }
        });
    }

    const observer = new MutationObserver(() => addImages());
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('load', () => {
        setTimeout(addImages, 1000);
    });

    // === FLOATING CHECKBOX TABLES ===
    function createTickBox(title, id) {
        const box = document.createElement('div');
        box.id = id;
        box.style.position = 'fixed';
        box.style.top = id === 'tickBox1' ? '200px' : '350px';
        box.style.right = '20px';
        box.style.width = '300px';
        box.style.backgroundColor = '#fff';
        box.style.border = '1px solid #ccc';
        box.style.borderRadius = '10px';
        box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        box.style.zIndex = '10001';
        box.style.padding = '10px';
        box.style.fontFamily = 'sans-serif';
        box.style.fontSize = '12px';

        const heading = document.createElement('div');
        heading.textContent = title;
        heading.style.textAlign = 'center';
        heading.style.marginBottom = '8px';
        box.appendChild(heading);

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        const days = ['H', 'K', 'SZ', 'CS', 'P'];
        const meals = ['Főétel', 'Vacsora'];

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        headRow.innerHTML = `<th></th>` + days.map(d => `<th>${d}</th>`).join('');
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        meals.forEach(meal => {
            const row = document.createElement('tr');
            const labelCell = document.createElement('td');
            labelCell.textContent = meal;
            row.appendChild(labelCell);

            days.forEach(day => {
                const cell = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.dataset.meal = meal;
                checkbox.dataset.day = day;
                checkbox.dataset.owner = id;
                checkbox.addEventListener('change', saveCheckboxStates);
                cell.appendChild(checkbox);
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        box.appendChild(table);
        document.body.appendChild(box);
    }

    function saveCheckboxStates() {
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"][data-owner]');
        const state = {};
        allCheckboxes.forEach(cb => {
            const key = `${cb.dataset.owner}_${cb.dataset.meal}_${cb.dataset.day}`;
            state[key] = cb.checked;
        });
        localStorage.setItem('interfood-tickbox-state', JSON.stringify(state));
    }

    function loadCheckboxStates() {
        const state = JSON.parse(localStorage.getItem('interfood-tickbox-state') || '{}');
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"][data-owner]');
        allCheckboxes.forEach(cb => {
            const key = `${cb.dataset.owner}_${cb.dataset.meal}_${cb.dataset.day}`;
            cb.checked = !!state[key];
        });
    }

    createTickBox('1', 'tickBox1');
    createTickBox('2', 'tickBox2');

    setTimeout(loadCheckboxStates, 500);
})();
