// Константы
const STORAGE_KEY = 'orders';
const STATUS_ICONS = {
    'в процессе': '🟡',
    'завершен': '🟢',
    'отменен': '🔴'
};

// Добавляем в начало файла после констант
const THEME_KEY = 'theme';

// Добавляем новую константу для хранения порядка колонок
const COLUMNS_ORDER_KEY = 'columnsOrder';

// Добавим константы для хранения состояния фильтров
const FILTERS_STATE_KEY = 'filtersState';

// Класс для управления данными
class OrdersManager {
    constructor() {
        try {
            // Изменяем инициализацию для загрузки из файла
            this.orders = [];
            this.columnsOrder = [];
            this.lastSaveTime = new Date();
            
            // Загружаем данные из файла при старте
            this.loadFromDataFile();
            
            // Инициализируем компоненты
            this.initComponents();
            
            // Рендерим таблицу
            this.renderTable();
            
            // Восстанавливаем состояние
            this.restoreState();

            this.history = [];
            this.currentIndex = -1;
            this.initUndoRedo();
        } catch (error) {
            console.error('Ошибка в конструкторе OrdersManager:', error);
            throw error;
        }
    }

    initComponents() {
        this.initEventListeners();
        this.initAutoSave();
        this.createSaveStatusIndicator();
    }

    restoreState() {
        // Применяем сохраненный порядок колонок
        setTimeout(() => {
            this.applyColumnsOrder();
        }, 0);

        // Восстанавливаем фильтры
        this.restoreFiltersState();
    }

    loadOrders() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }

    saveOrders() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
            this.updateSaveStatus('Сохранено');
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
            this.updateSaveStatus('Ошибка сохранения', 'error');
        }
    }

    addOrder(order) {
        this.addToHistory(() => {
            this.orders.push(order);
            this.saveOrders();
            this.renderTable();
        });
    }

    updateOrder(index, newOrder) {
        this.addToHistory(() => {
            this.orders[index] = newOrder;
            this.saveOrders();
            this.renderTable();
        });
    }

    deleteOrder(index) {
        if (confirm('Вы уверены, что хотите удалить эту заявку?')) {
            this.addToHistory(() => {
                this.orders.splice(index, 1);
                this.saveOrders();
                this.renderTable();
            });
        }
    }

    copyOrder(index) {
        const newOrder = { ...this.orders[index] };
        this.addOrder(newOrder);
    }

    getFormData() {
        const form = document.getElementById('orderForm');
        const formData = {
            author: form.author.value,
            material: form.material.value,
            quantity: form.quantity.value,
            unit: form.unit.value,
            category: form.category.value,
            supplier: form.supplier.value,
            address: form.address.value,
            phone: form.phone.value,
            email: form.email.value,
            status: form.status.value,
            orderDate: form.orderDate.value,
            paymentDeadline: form.paymentDeadline.value,
            paymentDate: form.paymentDate.value,
            deliveryDate: form.deliveryDate.value,
            deliveryType: form.deliveryType.value,
            amount: form.amount.value,
            paymentStatus: form.paymentStatus.value,
            notes: form.notes.value,
            responsible: form.responsible.value,
            link: form.link.value,
            priority: form.priority.value
        };
        return formData;
    }

    setFormData(order) {
        const form = document.getElementById('orderForm');
        Object.entries(order).forEach(([key, value]) => {
            if (form[key]) form[key].value = value || '';
        });
    }

    editOrder(index) {
        const order = this.orders[index];
        this.setFormData(order);
        document.getElementById('editIndex').value = index;
        document.getElementById('formTitle').textContent = 'Редактировать заявку';
        this.openForm();
    }

    openForm() {
        const dialog = document.getElementById('addOrderForm');
        dialog.showModal();
    }

    closeForm() {
        const dialog = document.getElementById('addOrderForm');
        dialog.close();
        this.clearForm();
    }

    clearForm() {
        document.getElementById('orderForm').reset();
        document.getElementById('editIndex').value = '-1';
        document.getElementById('formTitle').textContent = 'Добавить новую заявку';
    }

    createTableCells(order, index) {
        // Определяем структуру колонок
        const columns = [
            { key: 'index', label: 'П/П', type: 'text' },
            { key: 'status', label: 'Статус заказа', type: 'select' },
            { key: 'author', label: 'Автор заявки', type: 'text' },
            { key: 'material', label: 'Материал', type: 'text' },
            { key: 'priority', label: 'Приоритет', type: 'select' },
            { key: 'quantity', label: 'Количество', type: 'number' },
            { key: 'unit', label: 'Ед. изм.', type: 'text' },
            { key: 'category', label: 'Категория материала', type: 'text' },
            { key: 'supplier', label: 'Поставщик', type: 'text' },
            { key: 'phone', label: 'Телефон поставщика', type: 'tel' },
            { key: 'email', label: 'Email поставщика', type: 'email' },
            { key: 'orderDate', label: 'Дата заказа', type: 'date' },
            { key: 'paymentDate', label: 'Дата оплаты', type: 'date' },
            { key: 'deliveryDate', label: 'Дата привоза', type: 'date' },
            { key: 'deliveryType', label: 'Вид доставки', type: 'select' },
            { key: 'amount', label: 'Сумма заказа', type: 'number' },
            { key: 'paymentStatus', label: 'Состояние оплаты', type: 'select' },
            { key: 'notes', label: 'Примечания', type: 'text' },
            { key: 'responsible', label: 'Ответственное лицо', type: 'text' },
            { key: 'link', label: 'Ссылка на материалы', type: 'url' }
        ];

        // Опции для select полей
        const selectOptions = {
            status: ['🟡 В процессе', '🟢 Завершен', '🔴 Отменен'],
            priority: ['Высокий', 'Средний', 'Низкий'],
            deliveryType: ['Самовывоз', 'Доставка'],
            paymentStatus: ['Оплачено', 'Не оплачено']
        };

        return columns.map(column => {
            let value = column.key === 'index' ? (index + 1) : (order[column.key] || '');
            
            // Специальная обработка для ссылок
            if (column.type === 'url' && value) {
                return `<td class="editable" data-type="${column.type}" data-key="${column.key}">
                    <span class="cell-value"><a href="${value}" target="_blank">Ссылка</a></span>
                    <input type="text" class="cell-editor" style="display: none" value="${value}">
                </td>`;
            }
            
            // Обработка select полей
            if (column.type === 'select') {
                return `<td class="editable" data-type="${column.type}" data-key="${column.key}">
                    <span class="cell-value">${value}</span>
                    <select class="cell-editor" style="display: none">
                        ${selectOptions[column.key]?.map(opt => 
                            `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`
                        ).join('')}
                    </select>
                </td>`;
            }

            // Обработка остальных полей
            return `<td class="editable" data-type="${column.type}" data-key="${column.key}">
                <span class="cell-value">${value}</span>
                <input type="${column.type}" class="cell-editor" style="display: none" value="${value}">
            </td>`;
        }).join('');
    }

    initEventListeners() {
        // Проверяем существование элементов перед добавлением слушателей
        const form = document.getElementById('orderForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                window.saveOrder();
            });
        }

        const table = document.getElementById('ordersTable');
        if (table) {
            table.addEventListener('click', (e) => {
                const target = e.target;
                if (target.matches('[data-action]')) {
                    const action = target.dataset.action;
                    const index = parseInt(target.closest('tr').dataset.index);
                    
                    switch(action) {
                        case 'edit': this.editOrder(index); break;
                        case 'delete': this.deleteOrder(index); break;
                        case 'copy': this.copyOrder(index); break;
                    }
                }
            });
        }

        const filterStatus = document.getElementById('filterStatus');
        const filterPriority = document.getElementById('filterPriority');
        const searchInput = document.getElementById('searchInput');

        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.applyFilters());
        }
        if (filterPriority) {
            filterPriority.addEventListener('change', () => this.applyFilters());
        }
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applySearch());
        }

        // Добавляем обработчики для перетаскивания колонок
        const headerRow = document.querySelector('.header-row');
        const headers = headerRow.getElementsByTagName('th');

        Array.from(headers).forEach(header => {
            if (header.getAttribute('draggable') !== 'true') return;

            header.addEventListener('dragstart', this.handleDragStart.bind(this));
            header.addEventListener('dragover', this.handleDragOver.bind(this));
            header.addEventListener('drop', this.handleDrop.bind(this));
            header.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // Добавляем инициализацию редактирования в ячейках
        this.initCellEditing();

        // Добавляем горячие клавиши
        this.initHotkeys();
    }

    handleFormSubmit() {
        const formData = this.getFormData();
        const editIndex = parseInt(document.getElementById('editIndex').value);

        if (editIndex >= 0) {
            this.updateOrder(editIndex, formData);
        } else {
            this.addOrder(formData);
        }

        this.closeForm();
        this.showNotification('Заявка сохранена', 'success');
    }

    applyFilters() {
        const statusFilter = document.getElementById('filterStatus').value;
        const priorityFilter = document.getElementById('filterPriority').value;
        const searchFilter = document.getElementById('searchInput').value;
        
        // Сохраняем состояние фильтров
        const filtersState = {
            status: statusFilter,
            priority: priorityFilter,
            search: searchFilter
        };
        localStorage.setItem(FILTERS_STATE_KEY, JSON.stringify(filtersState));

        const rows = document.querySelectorAll('#ordersTable tbody tr');
        
        // Находим актуальные индексы колонок статуса и приоритета
        const headers = Array.from(document.querySelectorAll('.header-row th'));
        const statusColumnIndex = headers.findIndex(th => th.textContent === 'Статус заказа');
        const priorityColumnIndex = headers.findIndex(th => th.textContent === 'Приоритет');

        rows.forEach(row => {
            if (row.classList.contains('group-header')) return;

            // Получаем значения из ячеек, учитывая структуру с .cell-value
            const statusCell = row.cells[statusColumnIndex]?.querySelector('.cell-value');
            const priorityCell = row.cells[priorityColumnIndex]?.querySelector('.cell-value');
            
            const status = statusCell?.textContent.trim() || '';
            const priority = priorityCell?.textContent.trim() || '';

            // Проверяем совпадение значений
            const matchesStatus = !statusFilter || status === statusFilter;
            const matchesPriority = !priorityFilter || priority === priorityFilter;

            // Применяем фильтры
            row.style.display = (matchesStatus && matchesPriority) ? '' : 'none';

            // Для отладки
            if (!matchesStatus || !matchesPriority) {
                console.log('Фильтрация строки:', {
                    status,
                    statusFilter,
                    matchesStatus,
                    priority,
                    priorityFilter,
                    matchesPriority
                });
            }
        });

        // Применяем поиск после фильтров
        if (searchFilter) {
            this.applySearch();
        }
    }

    applySearch() {
        const searchInput = document.getElementById('searchInput');
        const searchText = searchInput.value.toLowerCase();
        
        const rows = document.querySelectorAll('#ordersTable tbody tr');

        rows.forEach(row => {
            if (row.classList.contains('group-header') || !searchText) {
                row.style.display = '';
                return;
            }

            let match = false;
            const cells = Array.from(row.cells);

            cells.forEach((cell, index) => {
                // Пропускаем только колонку действий
                if (index === cells.length - 1) {
                    return;
                }

                const cellValue = cell.querySelector('.cell-value');
                if (cellValue) {
                    // Убираем предыдущую подсветку
                    cellValue.innerHTML = cellValue.textContent;
                    
                    const text = cellValue.textContent.toLowerCase();
                    if (text.includes(searchText)) {
                        match = true;
                        // Подсвечиваем найденный текст
                        cellValue.innerHTML = cellValue.textContent.replace(
                            new RegExp(searchText, 'gi'),
                            match => `<mark class="search-highlight">${match}</mark>`
                        );
                    }
                }
            });

            row.style.display = match ? '' : 'none';
        });

        // Обновляем счетчик найденных строк
        this.updateSearchCounter();
    }

    updateSearchCounter() {
        const visibleRows = document.querySelectorAll('#ordersTable tbody tr:not([style*="display: none"])').length;
        const totalRows = document.querySelectorAll('#ordersTable tbody tr').length;
        const counterElement = document.getElementById('searchCounter');
        
        if (counterElement) {
            counterElement.textContent = `Найдено: ${visibleRows} из ${totalRows}`;
        }
    }

    exportToExcel() {
        ExcelExporter.export(this.orders);
    }

    renderTable() {
        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = '';
        
        this.orders.forEach((order, index) => {
            const row = tbody.insertRow();
            row.dataset.index = index;
            
            // Добавляем класс в зависимости от приоритета
            if (order.priority === 'Высокий') {
                row.classList.add('priority-high');
            } else if (order.priority === 'Средний') {
                row.classList.add('priority-medium');
            }
            
            // Добавляем ячейки с данными
            row.innerHTML = this.createTableCells(order, index);
            
            // Добавляем ячейку с кнопками действий
            const actionsCell = row.insertCell();
            actionsCell.className = 'actions-cell';
            actionsCell.innerHTML = `
                <button class="btn primary" onclick="window.ordersManager.editOrder(${index})">✏️</button>
                <button class="btn danger" onclick="window.ordersManager.deleteOrder(${index})">🗑️</button>
                <button class="btn secondary" onclick="window.ordersManager.copyOrder(${index})">📋</button>
            `;
        });
    }

    sortTable(columnIndex) {
        const tbody = document.querySelector('#ordersTable tbody');
        const rows = Array.from(tbody.rows);
        
        rows.sort((a, b) => {
            const aValue = a.cells[columnIndex].textContent.toLowerCase();
            const bValue = b.cells[columnIndex].textContent.toLowerCase();
            
            if (!isNaN(aValue) && !isNaN(bValue)) {
                return parseFloat(aValue) - parseFloat(bValue);
            }
            return aValue.localeCompare(bValue);
        });
        
        rows.forEach(row => tbody.appendChild(row));
    }

    saveToFile() {
        // Создаем объект с данными и порядком колонок
        const saveData = {
            orders: this.orders,
            columnsOrder: this.columnsOrder
        };
        
        const data = JSON.stringify(saveData, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (!e.target.result) {
                    alert('Файл пуст');
                    return;
                }

                let data;
                try {
                    data = JSON.parse(e.target.result);
                } catch (parseError) {
                    alert('Ошибка при разборе файла. Убедитесь, что это правильный JSON файл.');
                    console.error('Parse error:', parseError);
                    return;
                }

                // Проверяем новый формат данных
                if (data.orders && Array.isArray(data.orders)) {
                    // Новый формат с порядком колонок
                    if (confirm('Загрузка новых данных заменит текущие данные. Продолжить?')) {
                        this.orders = data.orders;
                        if (data.columnsOrder) {
                            this.columnsOrder = data.columnsOrder;
                            localStorage.setItem(COLUMNS_ORDER_KEY, JSON.stringify(data.columnsOrder));
                        }
                        this.saveOrders();
                        this.renderTable();
                        this.applyColumnsOrder();
                        alert('Данные успешно загружены!');
                    }
                } else if (Array.isArray(data)) {
                    // Старый формат, только заявки
                    if (confirm('Загрузка новых данных заменит текущие данные. Продолжить?')) {
                        this.orders = data;
                        this.saveOrders();
                        this.renderTable();
                        alert('Данные успешно загружены!');
                    }
                } else {
                    alert('Неверный формат данных');
                    return;
                }
            } catch (error) {
                alert('Произошла ошибка при чтении файла: ' + error.message);
                console.error('Load error:', error);
            }
        };

        reader.onerror = (error) => {
            alert('Ошибка при чтении файла: ' + error);
            console.error('Reader error:', error);
        };

        reader.readAsText(file);
    }

    handleDragStart(e) {
        const th = e.target;
        th.classList.add('dragging');
        e.dataTransfer.setData('text/plain', th.cellIndex);
    }

    handleDragOver(e) {
        e.preventDefault();
        const th = e.target.closest('th');
        if (th) {
            th.classList.add('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const th = e.target.closest('th');
        if (!th) return;

        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = th.cellIndex;

        if (fromIndex !== toIndex) {
            this.moveColumn(fromIndex, toIndex);
        }
        
        th.classList.remove('drag-over');
    }

    handleDragEnd(e) {
        const headers = document.querySelectorAll('.header-row th');
        headers.forEach(header => {
            header.classList.remove('dragging');
            header.classList.remove('drag-over');
        });
    }

    moveColumn(fromIndex, toIndex, saveOrder = true) {
        const table = document.getElementById('ordersTable');
        const rows = Array.from(table.rows);

        if (fromIndex === toIndex) return;

        // Перемещаем ячейки в каждой строке
        rows.forEach(row => {
            const cells = Array.from(row.cells);
            const [cell] = cells.splice(fromIndex, 1);
            cells.splice(toIndex, 0, cell);
            
            row.innerHTML = '';
            cells.forEach(c => row.appendChild(c));
        });

        if (saveOrder) {
            this.updateColumnsOrder();
        }
    }

    // Обновляем метод updateColumnsOrder
    updateColumnsOrder() {
        const headers = Array.from(document.querySelectorAll('.header-row th'));
        // Исключаем последнюю колонку (действия)
        const dataHeaders = headers.slice(0, -1);
        const order = dataHeaders.map(th => th.getAttribute('data-original-index'));
        localStorage.setItem(COLUMNS_ORDER_KEY, JSON.stringify(order));
        this.columnsOrder = order;

        // Обновляем индексы для сортировки
        dataHeaders.forEach((th, index) => {
            th.setAttribute('onclick', `sortTable(${index})`);
        });
    }

    // Метод загрузки порядка колонок
    loadColumnsOrder() {
        const savedOrder = localStorage.getItem(COLUMNS_ORDER_KEY);
        if (savedOrder) {
            try {
                const order = JSON.parse(savedOrder);
                // Проверяем, что порядок содержит все необходимые индексы
                const expectedLength = document.querySelectorAll('.header-row th').length - 1; // -1 для колонки действий
                const hasAllIndices = Array.from({ length: expectedLength }, (_, i) => i)
                    .every(index => order.includes(index.toString()));
                
                if (hasAllIndices) {
                    return order;
                }
            } catch (e) {
                console.error('Ошибка при загрузке порядка колонок:', e);
            }
        }
        // Возвращаем начальный порядок колонок
        return Array.from({ length: document.querySelectorAll('.header-row th').length - 1 }, (_, i) => i.toString());
    }

    // Обновляем метод applyColumnsOrder
    applyColumnsOrder() {
        const savedOrder = this.columnsOrder;
        if (!savedOrder || !Array.isArray(savedOrder)) return;

        const table = document.getElementById('ordersTable');
        const headers = Array.from(table.querySelectorAll('.header-row th'));
        
        // Исключаем колонку действий из перемещения
        const dataHeaders = headers.slice(0, -1);
        
        if (savedOrder.length !== dataHeaders.length) {
            console.warn('Количество сохраненных колонок не совпадает с текущим');
            return;
        }

        // Создаем временный массив для отслеживания перемещений
        const currentOrder = dataHeaders.map(th => th.getAttribute('data-original-index'));
        
        // Применяем сохраненный порядок
        savedOrder.forEach((targetIndex, newIndex) => {
            const currentIndex = currentOrder.indexOf(targetIndex);
            if (currentIndex !== newIndex) {
                // Перемещаем колонку
                this.moveColumn(currentIndex, newIndex, false);
                // Обновляем текущий порядок
                const [moved] = currentOrder.splice(currentIndex, 1);
                currentOrder.splice(newIndex, 0, moved);
            }
        });
    }

    // Добавляем методы для редактирования в ячейке
    initCellEditing() {
        const tbody = document.querySelector('#ordersTable tbody');
        
        tbody.addEventListener('dblclick', (e) => {
            const cell = e.target.closest('.editable');
            if (!cell) return;
            
            this.startEditing(cell);
        });

        tbody.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.stopEditing(false);
            } else if (e.key === 'Enter' && !e.shiftKey) {
                this.stopEditing(true);
            }
        });

        // Обработка клика вне редактируемой ячейки
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.cell-editor')) {
                this.stopEditing(true);
            }
        });
    }

    startEditing(cell) {
        // Останавливаем текущее редактирование
        this.stopEditing(true);

        const editor = cell.querySelector('.cell-editor');
        const display = cell.querySelector('.cell-value');
        
        if (editor && display) {
            display.style.display = 'none';
            editor.style.display = '';
            editor.focus();
            
            // Сохраняем ссылку на текущую редактируемую ячейку
            this.currentEditCell = cell;
        }
    }

    stopEditing(save) {
        if (!this.currentEditCell) return;

        const editor = this.currentEditCell.querySelector('.cell-editor');
        const display = this.currentEditCell.querySelector('.cell-value');
        
        if (editor && display) {
            if (save) {
                const newValue = editor.value;
                display.textContent = newValue;
                
                // Обновляем данные в orders
                const row = this.currentEditCell.closest('tr');
                const rowIndex = row.dataset.index;
                const key = this.currentEditCell.dataset.key;
                
                if (rowIndex !== undefined && key) {
                    this.orders[rowIndex][key] = newValue;
                    this.saveOrders();
                    
                    // Обновляем стили для приоритета
                    if (key === 'priority') {
                        row.className = ''; // Сбрасываем классы
                        if (newValue === 'Высокий') {
                            row.classList.add('priority-high');
                        } else if (newValue === 'Средний') {
                            row.classList.add('priority-medium');
                        }
                    }
                }
            }
            
            editor.style.display = 'none';
            display.style.display = '';
        }
        
        this.currentEditCell = null;
    }

    // Добавим метод для группировки данных
    groupData(groupBy) {
        const groups = {};
        this.orders.forEach(order => {
            const key = order[groupBy] || 'Без группы';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(order);
        });
        return groups;
    }

    // Добавим метод для отображения сгруппированных данных
    renderGroupedTable(groupBy) {
        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = '';
        
        const groups = this.groupData(groupBy);
        Object.entries(groups).forEach(([groupName, orders]) => {
            // Добавляем строку-заголовок группы
            const groupRow = tbody.insertRow();
            groupRow.className = 'group-header';
            groupRow.innerHTML = `
                <td colspan="21">
                    <div class="group-header-content">
                        <span>${groupName} (${orders.length})</span>
                        <button class="btn secondary toggle-group">▼</button>
                    </div>
                </td>
            `;
            
            // Добавляем строки с данными
            orders.forEach((order, index) => {
                const row = tbody.insertRow();
                row.className = 'group-content';
                row.dataset.index = this.orders.indexOf(order);
                // ... остальной код рендеринга строки
            });
        });
    }

    // Добавим методы для анализа данных
    getStatistics() {
        return {
            total: this.orders.length,
            byStatus: this.getCountByField('status'),
            byPriority: this.getCountByField('priority'),
            averageAmount: this.getAverageAmount(),
            completionRate: this.getCompletionRate()
        };
    }

    getCountByField(field) {
        return this.orders.reduce((acc, order) => {
            const value = order[field] || 'Не указано';
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
    }

    renderStatistics() {
        const stats = this.getStatistics();
        // Добавить отображение статистики в интерфейсе
    }

    validateOrder(order) {
        const errors = [];
        
        // Обязательные поля
        const required = ['author', 'material', 'quantity'];
        required.forEach(field => {
            if (!order[field]) {
                errors.push(`Поле "${field}" обязательно для заполнения`);
            }
        });
        
        // Проверка формата email
        if (order.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) {
            errors.push('Неверный формат email');
        }
        
        // Проверка количества
        if (order.quantity && (isNaN(order.quantity) || order.quantity <= 0)) {
            errors.push('Количество должно быть положительным числом');
        }
        
        return errors;
    }

    // Добавим отслеживание изменений
    addChangeHistory(order, field, oldValue, newValue) {
        if (!order.history) {
            order.history = [];
        }
        
        order.history.push({
            field,
            oldValue,
            newValue,
            date: new Date().toISOString(),
            user: 'Текущий пользователь' // Можно добавить систему пользователей
        });
    }

    // Показ истории изменений
    showHistory(orderIndex) {
        const order = this.orders[orderIndex];
        if (!order.history) return;
        
        // Создаем модальное окно с историей
        const dialog = document.createElement('dialog');
        dialog.className = 'history-modal';
        dialog.innerHTML = `
            <h3>История изменений</h3>
            <div class="history-list">
                ${order.history.map(change => `
                    <div class="history-item">
                        <div>Поле: ${change.field}</div>
                        <div>Старое значение: ${change.oldValue}</div>
                        <div>Новое значение: ${change.newValue}</div>
                        <div>Дата: ${new Date(change.date).toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
            <button onclick="this.closest('dialog').close()">Закрыть</button>
        `;
        document.body.appendChild(dialog);
        dialog.showModal();
    }

    initHotkeys() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N - новая заявка
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openForm();
            }
            
            // Ctrl/Cmd + S - сохранить в файл
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveToFile();
            }
            
            // Ctrl/Cmd + F - поиск
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    exportToPDF() {
        const doc = new jsPDF();
        
        // Добавляем заголовок
        doc.setFontSize(16);
        doc.text('Список заявок', 14, 15);
        
        // Конвертируем данные в формат для таблицы
        const tableData = this.orders.map(order => [
            order.status,
            order.author,
            order.material,
            // ... остальные поля
        ]);
        
        // Добавляем таблицу
        doc.autoTable({
            head: [['Статус', 'Автор', 'Материал', /* ... */]],
            body: tableData,
            startY: 25
        });
        
        // Сохраняем файл
        doc.save('orders.pdf');
    }

    // Обновим метод resetFilters
    resetFilters() {
        // Сбрасываем значения фильтров
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterPriority').value = '';
        document.getElementById('searchInput').value = '';
        
        // Очищаем сохраненное состояние
        localStorage.removeItem(FILTERS_STATE_KEY);
        
        // Показываем все строки
        const rows = document.querySelectorAll('#ordersTable tbody tr');
        rows.forEach(row => {
            if (!row.classList.contains('group-header')) {
                row.style.display = '';
            }
        });

        // Показываем уведомление
        this.showNotification('Фильтры сброшены', 'info');
    }

    // Добавим метод для восстановления состояния фильтров
    restoreFiltersState() {
        const savedState = localStorage.getItem(FILTERS_STATE_KEY);
        if (savedState) {
            try {
                const filters = JSON.parse(savedState);
                
                // Восстанавливаем значения фильтров
                document.getElementById('filterStatus').value = filters.status || '';
                document.getElementById('filterPriority').value = filters.priority || '';
                document.getElementById('searchInput').value = filters.search || '';
                
                // Применяем фильтры
                if (filters.status || filters.priority || filters.search) {
                    this.applyFilters();
                }
            } catch (e) {
                console.error('Ошибка при восстановлении состояния фильтров:', e);
                localStorage.removeItem(FILTERS_STATE_KEY);
            }
        }
    }

    initAutoSave() {
        let saveTimeout;
        const autoSave = () => {
            clearTimeout(saveTimeout);
            this.showSavingIndicator();
            
            saveTimeout = setTimeout(() => {
                this.saveOrders();
                this.lastSaveTime = new Date();
                this.updateSaveStatus('Сохранено');
            }, 1000); // Задержка 1 секунда перед сохранением
        };

        // Добавляем автосохранение при изменениях в таблице
        document.querySelector('#ordersTable').addEventListener('input', (e) => {
            if (e.target.matches('.cell-editor')) {
                autoSave();
            }
        });

        // Автосохранение при изменении формы
        document.querySelector('#orderForm').addEventListener('input', autoSave);

        // Показываем статус последнего сохранения
        this.createSaveStatusIndicator();
        this.updateSaveStatus('Сохранено');
    }

    createSaveStatusIndicator() {
        const statusContainer = document.createElement('div');
        statusContainer.className = 'save-status';
        statusContainer.innerHTML = `
            <span class="save-status-icon"></span>
            <span class="save-status-text"></span>
            <span class="save-status-time"></span>
        `;
        
        // Добавляем индикатор в header
        document.querySelector('.header-content').appendChild(statusContainer);
    }

    showSavingIndicator() {
        this.updateSaveStatus('Сохранение...', 'saving');
    }

    updateSaveStatus(message, status = 'saved') {
        const statusContainer = document.querySelector('.save-status');
        if (!statusContainer) return;

        const icon = statusContainer.querySelector('.save-status-icon');
        const text = statusContainer.querySelector('.save-status-text');
        const time = statusContainer.querySelector('.save-status-time');

        // Обновляем иконку и текст
        icon.textContent = status === 'saving' ? '⏳' : '✓';
        text.textContent = message;

        // Обновляем время последнего сохранения
        if (status === 'saved') {
            const timeStr = this.lastSaveTime.toLocaleTimeString();
            time.textContent = `(${timeStr})`;
        }

        // Обновляем классы для стилизации
        statusContainer.className = `save-status ${status}`;
    }

    // Метод для добавления действия в историю
    addToHistory(action) {
        const snapshot = this.createSnapshot();
        
        // Выполняем действие
        action();
        
        // Сохраняем состояние после действия
        const newSnapshot = this.createSnapshot();
        
        // Удаляем все действия после текущей позиции
        this.history = this.history.slice(0, this.currentIndex + 1);
        
        // Добавляем новое действие
        this.history.push({
            undo: () => this.restoreSnapshot(snapshot),
            redo: () => this.restoreSnapshot(newSnapshot)
        });
        
        this.currentIndex++;
        
        // Ограничиваем историю
        if (this.history.length > 50) {
            this.history.shift();
            this.currentIndex--;
        }

        this.updateUndoRedoStatus();
    }

    // Отмена действия
    undo() {
        if (this.currentIndex >= 0) {
            this.history[this.currentIndex].undo();
            this.currentIndex--;
            this.showNotification('Действие отменено', 'info');
            this.updateUndoRedoStatus();
        }
    }

    // Повтор действия
    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.history[this.currentIndex].redo();
            this.showNotification('Действие повторено', 'info');
            this.updateUndoRedoStatus();
        }
    }

    // Инициализация горячих клавиш
    initUndoRedo() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z - отмена
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            
            // Ctrl/Cmd + Shift + Z или Ctrl/Cmd + Y - повтор
            if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
                e.preventDefault();
                this.redo();
            }
        });

        // Добавляем визуальный индикатор
        this.createUndoRedoIndicator();
    }

    // Создаем визуальный индикатор
    createUndoRedoIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'undo-redo-status';
        indicator.innerHTML = `
            <button class="undo-btn" onclick="window.ordersManager.undo()" disabled>↩ Отменить</button>
            <button class="redo-btn" onclick="window.ordersManager.redo()" disabled>↪ Повторить</button>
        `;
        document.body.appendChild(indicator);
    }

    // Обновляем состояние кнопок
    updateUndoRedoStatus() {
        const undoBtn = document.querySelector('.undo-btn');
        const redoBtn = document.querySelector('.redo-btn');
        
        if (undoBtn && redoBtn) {
            undoBtn.disabled = this.currentIndex < 0;
            redoBtn.disabled = this.currentIndex >= this.history.length - 1;
            
            undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1';
            redoBtn.style.opacity = redoBtn.disabled ? '0.5' : '1';
        }
    }

    // Обновляем метод для редактирования ячейки
    handleCellEdit(cell, newValue) {
        const row = cell.closest('tr');
        const index = parseInt(row.dataset.index);
        const key = cell.dataset.key;
        
        if (index >= 0 && key) {
            const oldOrder = { ...this.orders[index] };
            const newOrder = { ...oldOrder, [key]: newValue };
            
            const action = {
                do: (manager) => {
                    manager.orders[index] = newOrder;
                    manager.saveOrders();
                },
                undo: (manager) => {
                    manager.orders[index] = oldOrder;
                    manager.saveOrders();
                }
            };
            
            action.do(this);
            this.addToHistory(action);
            this.renderTable();
        }
    }

    // Метод для создания снимка состояния
    createSnapshot() {
        return JSON.parse(JSON.stringify(this.orders));
    }

    // Метод для восстановления состояния
    restoreSnapshot(snapshot) {
        this.orders = JSON.parse(JSON.stringify(snapshot));
        this.saveOrders();
        this.renderTable();
    }

    // Добавляем метод для загрузки данных из файла
    async loadFromDataFile() {
        try {
            const response = await fetch('data/orders.json');
            if (!response.ok) {
                console.warn('Файл данных не найден, создаем новый');
                this.orders = [];
                this.columnsOrder = Array.from(
                    { length: document.querySelectorAll('.header-row th').length - 1 }, 
                    (_, i) => i.toString()
                );
                return;
            }
            const data = await response.json();
            this.orders = data.orders || [];
            this.columnsOrder = data.columnsOrder || [];
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
            this.showNotification('Ошибка при загрузке данных', 'error');
        }
    }

    // Изменяем метод сохранения
    async saveOrders() {
        try {
            const saveData = {
                orders: this.orders,
                columnsOrder: this.columnsOrder
            };

            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saveData)
            });

            if (!response.ok) {
                throw new Error('Ошибка при сохранении');
            }

            this.lastSaveTime = new Date();
            this.updateSaveStatus('Сохранено');
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
            this.updateSaveStatus('Ошибка сохранения', 'error');
            this.showNotification('Ошибка сохранения данных', 'error');
        }
    }
}

// Утилиты для работы с Excel
const ExcelExporter = {
    // Добавляем маппинг для заголовков
    headers: {
        'status': 'Статус заказа',
        'author': 'Автор заявки',
        'material': 'Материал',
        'priority': 'Приоритет',
        'quantity': 'Количество',
        'unit': 'Ед. изм.',
        'category': 'Категория материала',
        'supplier': 'Поставщик',
        'phone': 'Телефон поставщика',
        'email': 'Email поставщика',
        'orderDate': 'Дата заказа',
        'paymentDate': 'Дата оплаты',
        'deliveryDate': 'Дата привоза',
        'deliveryType': 'Вид доставки',
        'amount': 'Сумма заказа',
        'paymentStatus': 'Состояние оплаты',
        'notes': 'Примечания',
        'responsible': 'Ответственное лицо',
        'link': 'Ссылка на материалы'
    },

    export(orders) {
        // Преобразуем данные с русскими заголовками
        const translatedOrders = orders.map(order => {
            const translatedOrder = {};
            Object.entries(order).forEach(([key, value]) => {
                if (this.headers[key]) {
                    translatedOrder[this.headers[key]] = value;
                }
            });
            return translatedOrder;
        });

        // Создаем и настраиваем лист
        const worksheet = XLSX.utils.json_to_sheet(translatedOrders);

        // Настраиваем ширину колонок
        const columnWidths = Object.values(this.headers).map(header => ({
            wch: Math.max(header.length * 1.5, 15)
        }));
        worksheet['!cols'] = columnWidths;

        // Создаем книгу и добавляем лист
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Заявки');

        // Сохраняем файл
        const date = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
        XLSX.writeFile(workbook, `Заявки_${date}.xlsx`);
    }
};

// Функция для применения темы
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme || 'light');
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// Функция инициализации
function initializeApp() {
    // Применяем тему
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(savedTheme);

    // Инициализируем менеджер заказов
    window.ordersManager = new OrdersManager();
}

// Ждем полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Инициализируем индексы заголовков
        const headers = document.querySelectorAll('.header-row th');
        headers.forEach((th, index) => {
            th.setAttribute('data-original-index', index.toString());
        });

        // Запускаем инициализацию
        initializeApp();
    } catch (error) {
        console.error('Ошибка при инициализации:', error);
    }
});

// Обработчик ошибок
window.onerror = function(msg, url, line, col, error) {
    console.error('Глобальная ошибка:', {
        message: msg,
        url: url,
        line: line,
        column: col,
        error: error
    });
    return false;
};

// Глобальные функции для доступа из HTML
window.toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
};

window.toggleForm = () => {
    const dialog = document.getElementById('addOrderForm');
    if (dialog.open) {
        dialog.close();
    } else {
        dialog.showModal();
    }
};

window.exportToExcel = () => {
    if (window.ordersManager) {
        window.ordersManager.exportToExcel();
    }
};

window.saveOrder = () => {
    if (window.ordersManager) {
        window.ordersManager.handleFormSubmit();
    }
};

window.sortTable = (columnIndex) => {
    if (window.ordersManager) {
        window.ordersManager.sortTable(columnIndex);
    }
};

window.saveToFile = () => {
    if (window.ordersManager) {
        window.ordersManager.saveToFile();
    }
};

window.loadFromFile = (input) => {
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    
    // Проверки файла
    if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер 5MB');
        input.value = '';
        return;
    }

    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
        alert('Пожалуйста, выберите JSON файл');
        input.value = '';
        return;
    }

    if (window.ordersManager) {
        window.ordersManager.loadFromFile(file);
    }
    input.value = '';
};

window.applyFilters = () => {
    if (window.ordersManager) {
        window.ordersManager.applyFilters();
    }
};

// Функция сохранения данных
async function saveData() {
  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orders: orders,
        columnsOrder: columnsOrder
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Ошибка сохранения');
    }

    showNotification('Данные сохранены', 'success');
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    showNotification('Ошибка сохранения: ' + error.message, 'error');
  }
}

// Функция загрузки данных
async function loadData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки');
    }

    if (data.orders) {
      orders = data.orders;
    }
    if (data.columnsOrder) {
      columnsOrder = data.columnsOrder;
    }

    renderOrders();
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    showNotification('Ошибка загрузки: ' + error.message, 'error');
  }
}

// Добавляем автоматическое сохранение при изменениях
function onDataChanged() {
  saveData();
}

// Загружаем данные при старте
document.addEventListener('DOMContentLoaded', loadData);

// Добавляем обработчики для кнопок
document.getElementById('saveButton').addEventListener('click', saveData);
document.getElementById('loadButton').addEventListener('click', loadData);

// ... остальной код ...